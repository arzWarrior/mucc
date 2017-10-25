window.onload = function() {
  var NOME = 0,  QUANTIDADE = 1, ONDE_CRAFTAR = 2, ITENS_NECESSARIOS = 3, SOBRANDO = 2, ORDEM = 3;
  
  var recipe_file = document.getElementById('recipe_file');
  var craft_area = document.getElementById('craft_area');
  var craft_input = document.getElementById('craft_input');
  var craft_add = document.getElementById('craft_add');
  var chest_area = document.getElementById('chest_area');
  var calculate = document.getElementById('calculate');
  var recipe_span = document.getElementById('recipe_span');
  var calculate_span = document.getElementById('calculate_span');
  var recipes = [];
  var itens = [];
  var resources = [];
  var crafting = [];


  // abre e fecha o conteúdo da div checada
  function colapse() {
    var cbs = document.getElementsByName("cb");
    var dvs = document.getElementsByName("dv");

    for(var i = 0; i < cbs.length; i++) { 
       dvs[i].style.display = (cbs[i].checked ? "none" : "block");
    }
  }


  // altera a cor de fundo
  function highlight() {
    this.style.color = (this.style.color == "red" ? "black" : "red");
  }


  // percorre o vetor e retorna a posição do item desejado
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


  // retorna o valor convertido em grupos de 64 unidades
  function to_packs(qtd) {
    var p = Math.floor(qtd/64);
    var r = (qtd % 64);

    return (p > 0 ? p + "x64" : "") + (r > 0 ? (p > 0 ? " + " : "") + r : "");
  }


  // retorna texto com os itens necessários (apenas primeiro nível) para craftar a quantidade do item desejado
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


  // função recursiva que carrega os vetores de itens e recursos necessários para craftar a quantidade do item desejado
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

  
  // carrega o arquivo de receitas
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

            crafting.push(part1[0]);

            i++
          }
        }

        crafting.sort();

        recipe_span.innerText = " (" + i + " recipes loaded)";
      }

      reader.readAsText(file);  

    } else {
      areaTexto.innerHTML = "File not supported!";
    }

  });


  // autocomplete do JQuery
  $("#craft_input").autocomplete({
      source: crafting,
      minLength: 3
  });

  
  // transfere o item selecionado para a lista de itens a craftar
  craft_add.addEventListener('click', function(e) {
    if(craft_input.value != "") {
      craft_area.value += (craft_area.value != "" ? "\n" : "") + "1," + craft_input.value;
      craft_input.value = "";
    }
  });


  // botão calcular
  calculate.addEventListener('click', function(e) {
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
      if(i[1] > 0)
        texto += calcula1(1,i[0],i[1]);
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
