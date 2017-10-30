window.onload = function() {
  var NOME = 0,  QUANTIDADE = 1, ONDE_CRAFTAR = 2, ITENS_NECESSARIOS = 3, SOBRANDO = 2, ORDEM = 3;
  var fundos = ["brick.png","clay.png","coarse_dirt.png","cobblestone.png","cobblestone_mossy.png",
  "dirt.png","end_stone.png","farmland_dry.png","gravel.png","hardened_clay.png","ice.png",
  "log_oak.png","planks_birch.png","planks_oak.png","prismarine_bricks.png","prismarine_dark.png",
  "red_sand.png","sand.png","stone.png","stonebrick.png","stonebrick_mossy.png"];
  
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


  // trocar o background aleatoriamente
  document.body.style.background = 'url(images/' + fundos[Math.floor(Math.random() * fundos.length)] + ')';

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
    var dvs = document.getElementsByName("dv");

    for(let d of dvs) {
      d.children[0].style.display = ((d !== this) || (d.children[0].style.display == "block") ? "none" : "block");
      d.style.color = ((d !== this) || (d.style.color == "red") ? "black" : "red");
    }
  }


  // retorna as iniciais da string fornecida
  function initials(nome) {
    var initials = "";
    var partes = nome.split(" ");

    for(let p of partes)
      initials += p.charAt(0);

    return initials;
  }


  // percorre o vetor e retorna a posição do item desejado ou -1
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
  
    var texto = "", texto2 = "", graphic = ["","","","","","","","",""],
    tmp = find(item,recipes);
  
    if(tmp >= 0) {
      var isGraphic = false;
      var r = recipes[tmp];
      var qtdReal = Math.ceil(qtd/r[QUANTIDADE]);

      texto += qtd + "x " + r[NOME] + (qtdReal*r[QUANTIDADE] > qtd ? " (" + qtdReal*r[QUANTIDADE] + "x)" : "") + (r[ONDE_CRAFTAR] != "CT" ? " - " + r[ONDE_CRAFTAR] : "") + " <input type=\"checkbox\" name=\"cb\"><br />\n";
      texto += "<div name=\"dv\">\n<div class=\"craft\">\n";

      for(let r2 of r[ITENS_NECESSARIOS]) {
        texto2 += "&nbsp;&nbsp;&nbsp;" + qtdReal*r2[QUANTIDADE] + "x " + r2[NOME] + "<br />\n";

        // carregando a receita gráfica
        for(let rg of r2[2]) {
          graphic[rg-1] = initials(r2[NOME]);
          isGraphic = true;
        }
      }

      if(isGraphic) {
        texto += (r[ONDE_CRAFTAR] != "CT" ? r[ONDE_CRAFTAR] + "<br />\n" : "Crafting Table<br />\n") + "<table>\n";

        for(var x = 0; x < 3; x++) {
          texto += "<tr>\n";
          for(var y = 0; y < 3; y++) {
            texto += "<td>" + graphic[(x*3)+y] + "</td>\n";
          }
          texto += "</tr>\n"
        }

        texto += "</table>\n";
      }

      texto += "</div>\n" + texto2 + "</div>\n";
    }
  
    else {
      texto += qtd + "x " + item + " <input type=\"checkbox\"><br />\n";
    }
  
    return texto;
  }


  // função recursiva que carrega os vetores de itens e recursos necessários para craftar a quantidade do item desejado
  function calculaX(ident, item, qtd) {
    // exemplo de uma linha do vetor de receitas
    // ["Piston",1,"Crafting Table",[["Wood Planks",3,[1,2,3]],["Cobblestone",4,[4,6,7,9]],["Redstone",1,[8]],["Iron Ingot",1,[5]]]]
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
          calculaX(ident+1, r2[NOME], Math.ceil(qtd/r[QUANTIDADE])*r2[QUANTIDADE]);
        
        // atualizar lista de itens
        if(tmp >= 0) {
          itens[tmp][QUANTIDADE] += qtd;
          itens[tmp][SOBRANDO] += (Math.ceil(qtd/r[QUANTIDADE])*r[QUANTIDADE]) - qtd;
          if(itens[tmp][ORDEM] < ident)
            itens[tmp][ORDEM] = ident;
        }

        else {
          itens.push([item, qtd, (Math.ceil(qtd/r[QUANTIDADE])*r[QUANTIDADE]) - qtd, ident]);
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
    // exemplo de uma linha do arquivo de receitas
    // Piston,1,CT::Wood Planks,3,123|Cobblestone,4,4679|Redstone,1,8|Iron Ingot,1,5
    var file = recipe_file.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        var content = reader.result;
        var linhas = content.split("\n");
        var temp, temp2, temp3, part_item;
        var i = 0;

        for(let ln of linhas) {

          // remover a quebra de linha do final
          ln = ln.replace(/(\r\n|\n|\r)/gm,"");

          if((ln.length > 2) && (ln.substr(0,2) != "//")) {

            var part_recipe = [];

            temp = ln.split("::");
            part_item = temp[0].split(",");

            for(let t of temp[1].split("|")) {

              var part_graphic = [];

              temp2 = t.split(",");

              // ver se tem receita gráfica
              if(temp2.length == 3)
                for(let rg of Array.from(temp2[2]))
                  part_graphic.push(parseInt(rg));

              part_recipe.push([temp2[0].trim(),parseInt(temp2[1]),part_graphic]);
            }

            // ["Piston",1,"CT",[["Wood Planks",3,[1,2,3]],["Cobblestone",4,[4,6,7,9]],["Redstone",1,[8]],["Iron Ingot",1,[5]]]]
            recipes.push([part_item[0].trim(),parseInt(part_item[1]),part_item[2].trim(),part_recipe]);

            crafting.push(part_item[0].trim());

            i++
          }
        }

        crafting.sort();

        recipe_span.innerText = " (" + i + " receitas carregadas)";
      }

      reader.readAsText(file);  

    } else {
      calculate_span.innerHTML = "Arquivo não suportado!";
    }

  });


  // autocomplete do JQuery
  $("#craft_input").autocomplete({
      source: crafting,
      minLength: 1
  });

  
  // transfere o item selecionado para a lista de itens a craftar
  craft_add.addEventListener('click', function(e) {
    if(craft_input.value != "") {
      craft_area.value += (craft_area.value != "" ? "\n" : "") + "1," + craft_input.value;
      craft_input.value = "";
    }
  });


  // botão calcular!
  calculate.addEventListener('click', function(e) {
    var linhas; 
    var tmp;

    resources = [];
    itens = [];
    texto = "";

    // verificar receitas carregadas
    if(recipes.length > 0) {

      // itens a descontar
      linhas = chest_area.value.split("\n");
      
      for(let ln of linhas) {

        // remover a quebra de linha do final
        ln = ln.replace(/(\r\n|\n|\r)/gm,"");

        if((ln.length > 2) && (ln.substr(0,2) != "//")) {
          tmp = ln.split(",");
          itens.push([tmp[1].trim(), parseInt("-" + tmp[0]), parseInt(tmp[0]), 0]);
        }
      }

      // itens a craftar
      linhas = craft_area.value.split("\n");

      for(let ln of linhas) {

        // remover a quebra de linha do final
        ln = ln.replace(/(\r\n|\n|\r)/gm,"");

        if((ln.length > 2) && (ln.substr(0,2) != "//")) {
          tmp = ln.split(",");
          calculaX(1,tmp[1].trim(),parseInt(tmp[0]));
        }
      }

      // precisa de recursos
      if(resources.length > 0) {

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
      }
      else {
        calculate_span.innerHTML = "Nenhum item para craftar!";
      }
    }
    else {
      calculate_span.innerHTML = "Receitas não carregadas!";
    }

  });
}
