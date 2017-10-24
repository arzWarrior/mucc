window.onload = function() {
  var NOME = 0,  QUANTIDADE = 1, ONDE_CRAFTAR = 2, ITENS_NECESSARIOS = 3, SOBRANDO = 2, ORDEM = 3;
  
  var recipe_file = document.getElementById('recipe_file');
  var craft_area = document.getElementById('craft_area');
  var craft_select = document.getElementById('craft_select');
  var craft_add = document.getElementById('craft_add');
  var chest_area = document.getElementById('chest_area');
  var chest_select = document.getElementById('chest_select');
  var chest_add = document.getElementById('chest_add');
  var calculate = document.getElementById('calculate');
  var recipe_span = document.getElementById('recipe_span');
  var calculate_span = document.getElementById('calculate_span');
  var recipes = [];
  var itens = [];
  var resources = [];

  function colapse() {
    var cbs = document.getElementsByName("cb");
    var dvs = document.getElementsByName("dv");

    for(var i = 0; i < cbs.length; i++) { 
       dvs[i].style.display = (cbs[i].checked ? "none" : "block");
    }
  }
  
  function highlight() {
    this.style.color = (this.style.color == "red" ? "black" : "red");
  }
  
  function find(item, lista) {
    var i = 0;
    for(let l of lista) {
      if(l[NOME] == item) {
        return i;
      }
      i++;
    }
    return -1;
  }

  function to_packs(qtd) {
    var p = Math.floor(qtd/64);
    var r = (qtd % 64);

    return (p > 0 ? p + "x64" : "") + (r > 0 ? (p > 0 ? " + " : "") + r : "");
  }


  function calcula(ident, item, qtd) {
    var texto = "", 
    tmp = find(item,recipes);
  
    if(tmp >= 0) {
      r = recipes[tmp];

      texto += " ".repeat(ident*3) + " " + qtd + "x " + r[NOME] + "\n";
      
      for(let r2 of r[ITENS_NECESSARIOS])
        texto += calcula(ident+1, r2[NOME], Math.ceil(qtd/parseInt(r[QUANTIDADE]))*parseInt(r2[QUANTIDADE]));
    }

    else {
      texto += " ".repeat(ident*3) + " " + qtd + "x " + item + "\n";
    }
  
    return texto;
  }


  function calcula1(ident, item, qtd) {
  
    var texto = "", 
    tmp = find(item,recipes);
  
    if(tmp >= 0) {
      var r = recipes[tmp];
      var qtdReal = Math.ceil(qtd/parseInt(r[QUANTIDADE]));

      texto += qtd + "x " + r[NOME] + (qtdReal*parseInt(r[QUANTIDADE]) > qtd ? " (" + qtdReal*parseInt(r[QUANTIDADE]) + "x)" : "") + (r[ONDE_CRAFTAR] != "CT" ? " - " + r[ONDE_CRAFTAR] : "") + " <input type=\"checkbox\" name=\"cb\"><br />\n";
      texto += "<div name=\"dv\">\n";
      for(let r2 of r[ITENS_NECESSARIOS])
        texto += "&nbsp;&nbsp;&nbsp;" + qtdReal*parseInt(r2[QUANTIDADE]) + "x " + r2[NOME] + "<br />\n";
	  texto += "</div>\n";
    }
  
    else {
      texto += qtd + "x " + item + " <input type=\"checkbox\"><br />\n";
    }
  
    return texto;
  }

  function calculaX(ident, item, qtd) {
  // ["Piston",1,"Crafting Table",[["Wood Planks",3],["Cobblestone",4],["Redstone",1],["Iron Ingot",1]]]
    var tmp = find(item,recipes);
    if(tmp >= 0) {
      var r = recipes[tmp];

      // ver se ja nao tem algum sobrando
      tmp = find(item,itens);
      if((tmp >= 0) && (itens[tmp][SOBRANDO] >= 1)) {
        // tem sobrando, descontar
        var y = Math.min(itens[tmp][SOBRANDO], qtd);
        qtd -= y;
        itens[tmp][QUANTIDADE] += y;
        itens[tmp][SOBRANDO] -= y;
        if(itens[tmp][ORDEM] < ident)
            itens[tmp][ORDEM] = ident;
      }

      if(qtd > 0) {
        // nao tinha o suficiente
        for(let r2 of r[ITENS_NECESSARIOS])
          calculaX(ident+1, r2[NOME], Math.ceil(qtd/parseInt(r[QUANTIDADE]))*parseInt(r2[QUANTIDADE]));
        
        // atualizar lista de itens
        if(tmp >= 0) {
          itens[tmp][QUANTIDADE] += qtd;
          itens[tmp][SOBRANDO] += (Math.ceil(qtd/parseInt(r[QUANTIDADE]))*parseInt(r[QUANTIDADE])) - qtd;
          if(itens[tmp][ORDEM] < ident)
            itens[tmp][ORDEM] = ident;
        }

        else {
          itens.push([item, qtd, (Math.ceil(qtd/parseInt(r[QUANTIDADE]))*parseInt(r[QUANTIDADE])) - qtd, ident]);
        }
      }
    }
  
    else {
      // atualizar lista de recursos
      tmp = find(item,resources);
      if(tmp >= 0) {
        resources[tmp][QUANTIDADE] += qtd;
      }
      else {
        resources.push([item,qtd]);
      }
    }
  }
  

  recipe_file.addEventListener('change', function(e) {
    var file = recipe_file.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        var content = reader.result;
        var linhas = content.split("\n");
        var temp, part1;
        var i = 0;

        for(let ln of linhas) {
          if(ln.length > 0) {

            var part2 = [];

            temp = ln.split("::");
            part1 = temp[0].split(",");

            for(let t of temp[1].split("|")) {
              part2.push(t.split(","));
            }

            recipes.push([part1[0],part1[1],part1[2],part2]);

            var opt = document.createElement("option");
            opt.text = part1[0];
            opt.value = i;
            craft_select.add(opt);
            
            i++
          }
        }

        recipe_span.innerText = " (" + i + " recipes loaded)";
      }

      reader.readAsText(file);  

    } else {
      areaTexto.innerHTML = "File not supported!";
    }

  });

  craft_add.addEventListener('click', function(e) {
    if(craft_select.selectedIndex > 0) {
      craft_area.value += (craft_area.value != "" ? "\n" : "") + "1," + craft_select.options[craft_select.selectedIndex].text;
      craft_select.selectedIndex = 0;
    }
  });
  
  chest_add.addEventListener('click', function(e) {
    if(chest_select.selectedIndex > 0) {
      chest_area.value += (chest_area.value != "" ? "\n" : "") + "1," + chest_select.options[chest_select.selectedIndex].text;
      chest_select.selectedIndex = 0;
    }
  });
  
  calculate.addEventListener('click', function(e) {

    while(chest_select.options.length > 1) {
      chest_select.remove(1);
    }
  
    var linhas = chest_area.value.split("\n");
    var tmp;

    resources = [];
    itens = [];
    texto = "";

    for(let ln of linhas) {
      if(ln.length > 0) {
        tmp = ln.split(",");
        itens.push([tmp[1], parseInt("-" + tmp[0]), parseInt(tmp[0]), 0]);
      }
    }
	
    linhas = craft_area.value.split("\n");

    for(let ln of linhas) {
      tmp = ln.split(",");
      calculaX(1,tmp[1],parseInt(tmp[0]));
    }

    texto += "<br />\n";
  
    for(let r of resources)
      texto += r[NOME] + ": " + to_packs(r[QUANTIDADE]) + " <input type=\"checkbox\"><br />\n";
  
    texto += "<br />\n";

    itens.sort(function(a,b){return b[3] - a[3]});

    for(let i of itens) {
      if(i[1] > 0) {
        texto += calcula1(1,i[0],i[1]);
        
        var opt = document.createElement("option");
        opt.text = i[0];
        opt.value = i[0];
        chest_select.add(opt);
      }
    }

    calculate_span.innerHTML = texto;

    var checks = document.getElementsByName('cb');

    for(var i = 0; i < checks.length; i++)
      checks[i].addEventListener('change', colapse);

    var divs = document.getElementsByName('dv');

    for(var i=0;i<divs.length;i++)
      divs[i].addEventListener('click', highlight);
  
  });
}
