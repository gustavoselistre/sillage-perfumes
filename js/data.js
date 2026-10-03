/* Sillage Perfumes Importados — todo o conteúdo editável do site fica aqui.
   main.js só renderiza. Para trocar produtos, fragrâncias ou contatos, edite este arquivo. */

const CONFIG = {
  // WhatsApp com DDI + DDD, só dígitos.
  whatsapp: "5551996689650",
  whatsappDisplay: "(51) 99668-9650",
  instagram: "sillageperfumesimportados",
  payments: ["Pix", "Cartão de crédito", "Cartão de débito", "Transferência"],
};

/* Famílias olfativas. "todos" é o filtro inicial.
   colors: [claro, escuro] do gradiente do card da seção Fragrâncias. */
const FAMILIES = [
  { id: "todos", label: "Todos" },
  { id: "amadeirado", label: "Amadeirado", text: "Oud, sândalo e cedro: elegância que fica na pele.", colors: ["#8a5a2b", "#2a1a0e"] },
  { id: "citrico", label: "Cítrico", text: "Bergamota, limão e frescor para o dia a dia.", colors: ["#e6c34a", "#5a4a12"] },
  { id: "floral", label: "Floral", text: "Rosa, jasmim e orquídea com toque delicado.", colors: ["#e8a3b3", "#5b2433"] },
  { id: "oriental", label: "Oriental", text: "Especiarias, âmbar e açafrão: intenso e marcante.", colors: ["#d9822b", "#3d1d08"] },
  { id: "gourmand", label: "Gourmand", text: "Baunilha, caramelo e praliné. Doce na medida.", colors: ["#e9c79a", "#5a3a1c"] },
  { id: "frutado", label: "Frutado", text: "Pêssego, manga e frutas vermelhas, alegre e solar.", colors: ["#f0a35c", "#6b2e12"] },
  { id: "aromatico", label: "Aromático", text: "Lavanda, menta e ervas frescas, clássico masculino.", colors: ["#8fa88a", "#1f2e22"] },
];

/* Categorias do catálogo (abas acima da vitrine). "todas" é o filtro inicial. */
const CATEGORIES = [
  { id: "todas", label: "Todos" },
  { id: "masculino", label: "Masculino" },
  { id: "feminino", label: "Feminino" },
  { id: "hidratantes", label: "Hidratantes" },
  { id: "body-splash", label: "Body Splash" },
  { id: "infantil", label: "Infantil" },
];

/* Produtos — tirados do catálogo "SIllage Catálogo editado.pdf" (o comentário indica a página).
   - category: id de CATEGORIES.
   - families: famílias olfativas deduzidas das notas (o filtro usa families.includes).
   - notes: topo / coração / fundo, como no catálogo. Sem notas → use desc (texto curto).
   - price: valor em reais (null = "Consulte"). oldPrice: preço antigo riscado (promoção).
   - soldOut: true mostra o selo "Esgotado" e troca o botão por "Avise-me quando chegar".
   - sizes (opcional): ex. ["100 ml"]. O catálogo não informa, então fica de fora.
   - image: foto do catálogo. Se não carregar, aparece um frasco ilustrado; bottle.bg é a cor do fundo do card. */
const PRODUCTS = [
  {
    id: "supremacy-collectors", brand: "Afnan", name: "Supremacy Collector’s Edition", category: "masculino",
    families: ["oriental", "floral"], price: null, soldOut: true,
    notes: { topo: "Abacaxi, bergamota, maçã e flores brancas.", coracao: "Flor de laranjeira, bétula e âmbar.", fundo: "Musgo de carvalho, almíscar e âmbar-cinzento." },
    image: "img/products/supremacy-collectors.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 3
  },
  {
    id: "panther", brand: "Maison Alhambra", name: "Panther Pour Homme", category: "masculino",
    families: ["aromatico", "citrico"], price: 339,
    notes: { topo: "Lavanda, raspas de limão e limão de Amalfi.", coracao: "Maçã, patchouli, fumaça e notas terrosas.", fundo: "Baunilha, lavanda e vetiver." },
    image: "img/products/panther.jpg", bottle: { bg: ["#8fa88a", "#1f2e22"] }, // pág. 3
  },
  {
    id: "9pm", brand: "Afnan", name: "9PM", category: "masculino",
    families: ["oriental", "gourmand"], price: 279,
    notes: { topo: "Maçã, canela, lavanda e bergamota.", coracao: "Flor de laranjeira e lírio-do-vale.", fundo: "Baunilha, fava-tonka, âmbar e patchouli." },
    image: "img/products/9pm.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 3
  },
  {
    id: "asad-elixir", brand: "Lattafa", name: "Asad Elixir", category: "masculino",
    families: ["amadeirado", "oriental"], price: 399,
    notes: { topo: "Pimenta rosa, açafrão e toranja.", coracao: "Tabaco, madeira de cedro e baunilha.", fundo: "Âmbar Claro, Patchouli, Olíbano e Cashmeran (rastro magnético, amadeirado e resinoso)." },
    image: "img/products/asad-elixir.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 4
  },
  {
    id: "odyssey-homme", brand: "Armaf", name: "Odyssey Homme", category: "masculino",
    families: ["floral", "amadeirado"], price: 339,
    notes: { topo: "Cardamomo, néroli e mandarina.", coracao: "Flor de laranjeira e rosa.", fundo: "Baunilha, sândalo, madeiras e âmbar." },
    image: "img/products/odyssey-homme.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 4
  },
  {
    id: "musamam-black", brand: "Lattafa", name: "Musamam Black Intense", category: "masculino",
    families: ["aromatico", "amadeirado"], price: 469,
    notes: { topo: "Lavanda, noz-moscada, sálvia e bergamota.", coracao: "Cedro, gerânio, rosyfolia e mahonial.", fundo: "Fava-tonka, bordo, patchouli e ambrofix." },
    image: "img/products/musamam-black.jpg", bottle: { bg: ["#8fa88a", "#1f2e22"] }, // pág. 4
  },
  {
    id: "9pm-elixir", brand: "Afnan", name: "9PM Elixir", category: "masculino",
    families: ["oriental"], price: 299,
    notes: { topo: "Cardamomo, noz-moscada e elemi.", coracao: "Pimenta, couro e lavanda.", fundo: "Baunilha, patchouli, ládano e cisto." },
    image: "img/products/9pm-elixir.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 5
  },
  {
    id: "oud-for-glory", brand: "Lattafa", name: "Oud for Glory", category: "masculino",
    families: ["amadeirado"], price: 289,
    notes: { topo: "Açafrão, noz-moscada e lavanda.", coracao: "Oud e patchouli.", fundo: "Oud, patchouli e almíscar." },
    image: "img/products/oud-for-glory.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 5
  },
  {
    id: "liquid-brun", brand: "French Avenue", name: "Liquid Brun", category: "masculino",
    families: ["amadeirado", "gourmand"], price: 399,
    notes: { topo: "Canela, flor de laranjeira, cardamomo e bergamota.", coracao: "Baunilha bourbon e elemi.", fundo: "Pralinê, ambroxan, madeira guaiaco e almíscar." },
    image: "img/products/liquid-brun.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 5
  },
  {
    id: "wolf", brand: "Rayhaan", name: "Wolf", category: "masculino",
    families: ["oriental"], price: null, soldOut: true,
    notes: { topo: "Cardamomo.", coracao: "Toffee.", fundo: "Madeira de âmbar." },
    image: "img/products/wolf.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 6
  },
  {
    id: "lionheart", brand: "Armaf", name: "Club de Nuit Lionheart Man", category: "masculino",
    families: ["aromatico", "gourmand"], price: 319,
    notes: { topo: "Lavanda e hortelã.", coracao: "Benjoim e baunilha.", fundo: "Mel, fava-tonka e tabaco." },
    image: "img/products/lionheart.jpg", bottle: { bg: ["#8fa88a", "#1f2e22"] }, // pág. 6
  },
  {
    id: "spectre-wraith", brand: "French Avenue", name: "Spectre Wraith", category: "masculino",
    families: ["gourmand", "amadeirado"], price: 429,
    notes: { topo: "Rum e especiarias.", coracao: "Café, vetiver, patchouli e sândalo.", fundo: "Cana-de-açúcar." },
    image: "img/products/spectre-wraith.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 6
  },
  {
    id: "asad-bourbon", brand: "Lattafa", name: "Asad Bourbon", category: "masculino",
    families: ["oriental", "gourmand"], price: 399,
    notes: { topo: "Lavanda, ameixa mirabelle e pimenta-rosa.", coracao: "Cacau, noz-moscada e davana.", fundo: "Baunilha bourbon, âmbar e vetiver." },
    image: "img/products/asad-bourbon.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 7
  },
  {
    id: "khamrah", brand: "Lattafa", name: "Khamrah", category: "masculino",
    families: ["oriental", "gourmand"], price: 349,
    notes: { topo: "Canela, noz-moscada e bergamota.", coracao: "Tâmaras, pralinê, tuberosa e mahonial.", fundo: "Baunilha, fava-tonka, âmbar, mirra e benjoim." },
    image: "img/products/khamrah.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 7
  },
  {
    id: "hawas-black", brand: "Rasasi", name: "Hawas Black", category: "masculino",
    families: ["citrico", "amadeirado"], price: null, soldOut: true,
    notes: { topo: "Bergamota, toranja e abacaxi.", coracao: "Cedro, jasmim e patchouli.", fundo: "Âmbar, musgo de carvalho e notas amadeiradas." },
    image: "img/products/hawas-black.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 7
  },
  {
    id: "asad", brand: "Lattafa", name: "Asad", category: "masculino",
    families: ["oriental"], price: 339,
    notes: { topo: "Pimenta-preta, tabaco e abacaxi.", coracao: "Patchouli, café e íris.", fundo: "Baunilha, âmbar, madeiras secas, benjoim e ládano." },
    image: "img/products/asad.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 8
  },
  {
    id: "mandarin-sky", brand: "Armaf", name: "Odyssey Mandarin Sky", category: "masculino",
    families: ["citrico", "gourmand"], price: 349,
    notes: { topo: "Mandarina, laranja, açafrão e sálvia.", coracao: "Caramelo, fava-tonka e tagetes.", fundo: "Ambroxan, cedro e vetiver." },
    image: "img/products/mandarin-sky.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 8
  },
  {
    id: "rayhaan-elixir", brand: "Rayhaan", name: "Rayhaan Elixir", category: "masculino",
    families: ["aromatico", "gourmand"], price: 369,
    notes: { topo: "Menta e bergamota.", coracao: "Lavanda e benjoim.", fundo: "Baunilha e fava-tonka." },
    image: "img/products/rayhaan-elixir.jpg", bottle: { bg: ["#8fa88a", "#1f2e22"] }, // pág. 8
  },
  {
    id: "cdn-intense", brand: "Armaf", name: "Club de Nuit Intense Man", category: "masculino",
    families: ["citrico", "amadeirado"], price: 339,
    notes: { topo: "Limão, abacaxi, bergamota, groselha-preta e maçã.", coracao: "Bétula, jasmim e rosa.", fundo: "Almíscar, âmbar-cinzento, patchouli e baunilha." },
    image: "img/products/cdn-intense.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 9
  },
  {
    id: "the-kingdom", brand: "Lattafa", name: "The Kingdom", category: "masculino",
    families: ["frutado", "gourmand"], price: 399,
    notes: { topo: "Pera, peônia e cassis.", coracao: "Jasmim, pralinê e fava-tonka.", fundo: "Baunilha, almíscar, sândalo e âmbar." },
    image: "img/products/the-kingdom.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 9
  },
  {
    id: "royal-blend-nero", brand: "French Avenue", name: "Royal Blend Nero", category: "masculino",
    families: ["oriental", "gourmand"], price: 449,
    notes: { topo: "Bergamota, noz-moscada, tâmara e maçã.", coracao: "Canela, açafrão e madeiras secas.", fundo: "Baunilha, benjoim, fava-tonka e almíscar." },
    image: "img/products/royal-blend-nero.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 9
  },
  {
    id: "al-noble-ameer", brand: "Lattafa", name: "Al Noble Ameer", category: "masculino",
    families: ["amadeirado", "oriental"], price: 229,
    notes: { topo: "Maçã, pimenta-rosa e alecrim.", coracao: "Cravo e notas florais.", fundo: "Oud, patchouli, cipreste, ládano e vetiver." },
    image: "img/products/al-noble-ameer.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 10
  },
  {
    id: "al-noble-wazeer", brand: "Lattafa", name: "Al Noble Wazeer", category: "masculino",
    families: ["gourmand", "amadeirado"], price: 179, oldPrice: 229,
    notes: { topo: "Hortelã, laranja amarga, bergamota e zimbro.", coracao: "Chocolate, caramelo, pera, íris e framboesa.", fundo: "Sândalo, âmbar, cedro, almíscar, vetiver e baunilha." },
    image: "img/products/al-noble-wazeer.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 10
  },
  {
    id: "supremacy-not-only-intense", brand: "Afnan", name: "Supremacy Not Only Intense", category: "masculino",
    families: ["aromatico", "oriental"], price: null, soldOut: true,
    notes: { topo: "Bergamota, maçã, groselha preta.", coracao: "Lavanda, patchouli, musgo de carvalho.", fundo: "Açafrão, musk, âmbar cinzento." },
    image: "img/products/supremacy-not-only-intense.jpg", bottle: { bg: ["#8fa88a", "#1f2e22"] }, // pág. 10
  },
  {
    id: "supremacy-silver", brand: "Afnan", name: "Supremacy Pour Homme Silver", category: "masculino",
    families: ["frutado", "amadeirado"], price: 489,
    notes: { topo: "Maçã, bergamota, musgo de carvalho.", coracao: "Abacaxi, patchouli, jasmim.", fundo: "Musk, âmbar cinzento, bétula." },
    image: "img/products/supremacy-silver.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 11
  },
  {
    id: "cdn-intense-extrait", brand: "Armaf", name: "Club de Nuit Intense Man Extrait", category: "masculino",
    families: ["citrico", "amadeirado"], price: 399,
    notes: { topo: "Abacaxi, limão, bergamota, groselha-preta e maçã.", coracao: "Bétula, rosa e jasmim.", fundo: "Patchouli, baunilha, âmbar-cinzento e almíscar." },
    image: "img/products/cdn-intense-extrait.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 11
  },
  {
    id: "cdn-iconic", brand: "Armaf", name: "Club de Nuit Iconic", category: "masculino",
    families: ["citrico", "amadeirado"], price: 399,
    notes: { topo: "Grapefruit, limão, hortelã, pimenta-rosa e coentro.", coracao: "Gengibre, noz-moscada, jasmim e melão.", fundo: "Incenso, âmbar, cedro, sândalo, patchouli, ládano e notas amadeiradas." },
    image: "img/products/cdn-iconic.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 11
  },
  {
    id: "cdn-precieux", brand: "Armaf", name: "Club de Nuit Précieux I", category: "masculino",
    families: ["oriental", "gourmand"], price: 449,
    notes: { topo: "Bergamota, limão, pimentas, abacaxi, pera e caramelo.", coracao: "Anis e lírio-do-vale.", fundo: "Âmbar, cedro, couro, patchouli, almíscar, baunilha e ambroxan." },
    image: "img/products/cdn-precieux.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 12
  },
  {
    id: "king-of-arabia", brand: "Lattafa", name: "King of Arabia", category: "masculino",
    families: ["floral", "amadeirado"], price: null, soldOut: true,
    notes: { topo: "Bergamota e framboesa.", coracao: "Cedro, osmanthus e íris.", fundo: "Couro, baunilha e patchouli." },
    image: "img/products/king-of-arabia.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 12
  },
  {
    id: "cdn-sillage", brand: "Armaf", name: "Club de Nuit Sillage", category: "masculino",
    families: ["citrico", "floral"], price: 369,
    notes: { topo: "Bergamota, limão, lima, gengibre, groselha-preta e folhas de violeta.", coracao: "Jasmim, íris e rosa.", fundo: "Sândalo, cedro, almíscar e ambroxan." },
    image: "img/products/cdn-sillage.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 12
  },
  {
    id: "attar-al-wesal", brand: "Al Wataniah", name: "Attar Al Wesal Gold", category: "masculino",
    families: ["oriental"], price: 289,
    notes: { topo: "Pera, lavanda, hortelã, bergamota e limão.", coracao: "Canela, cominho e alcaravia.", fundo: "Baunilha negra, âmbar, patchouli e cedro." },
    image: "img/products/attar-al-wesal.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 13
  },
  {
    id: "khanjar", brand: "Lattafa", name: "Khanjar", category: "masculino",
    families: ["oriental", "amadeirado"], price: 479,
    notes: { topo: "Noz-moscada, gengibre, pimenta pimento.", coracao: "Cashmeran, violeta, patchouli.", fundo: "Vetiver, incenso, musk, couro." },
    image: "img/products/khanjar.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 13
  },
  {
    id: "kit-supremacy-silver", brand: "Afnan", name: "Kit Supremacy Silver", category: "masculino",
    families: ["frutado", "amadeirado"], price: 599,
    notes: { topo: "Maçã, bergamota, musgo de carvalho.", coracao: "Abacaxi, patchouli, jasmim.", fundo: "Musk, âmbar cinzento, bétula." },
    desc: "EDP 100 ml + Shower Gel 100 ml + After Shave 100 ml.",
    sizes: ["Kit 3 peças"],
    image: "img/products/kit-supremacy-silver.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 13
  },
  {
    id: "souvenir-desert-rose", brand: "Afnan", name: "Souvenir Desert Rose", category: "masculino",
    families: ["frutado", "floral"], price: 369,
    notes: { topo: "Pêssego, framboesa, cassis.", coracao: "Heliotrópio, lírio-do-vale, musk branco.", fundo: "Sândalo, cítricos, âmbar." },
    image: "img/products/souvenir-desert-rose.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 14
  },
  {
    id: "khamrah-dukhan", brand: "Lattafa", name: "Khamrah Dukhan", category: "masculino",
    families: ["oriental"], price: 349,
    notes: { topo: "Mandarina, pimento e especiarias defumadas.", coracao: "Cistus, flor de laranjeira, incenso e patchouli.", fundo: "Tabaco, âmbar, fava-tonka, benjoim e pralinê." },
    image: "img/products/khamrah-dukhan.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 14
  },
  {
    id: "khamrah-qahwa", brand: "Lattafa", name: "Khamrah Qahwa", category: "masculino",
    families: ["gourmand", "oriental"], price: 349,
    notes: { topo: "Gengibre, canela e cardamomo.", coracao: "Pralinê, frutas cristalizadas e flores brancas.", fundo: "Café arábica, fava-tonka, almíscar, benjoim e baunilha." },
    image: "img/products/khamrah-qahwa.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 14
  },
  {
    id: "vintage-castle", brand: "Lattafa", name: "Vintage Castle", category: "masculino",
    families: ["amadeirado", "floral"], price: 399,
    notes: { topo: "Notas verdes, patchouli e íris.", coracao: "Patchouli e mimosa.", fundo: "Patchouli, marshmallow e civeta." },
    image: "img/products/vintage-castle.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 15
  },
  {
    id: "maahir-gold", brand: "Lattafa", name: "Maahir Gold Edition", category: "masculino",
    families: ["oriental", "amadeirado"], price: null, soldOut: true,
    notes: { topo: "Açafrão e rosa.", coracao: "Akigalawood, couro e âmbar seco.", fundo: "Acorde oud, baunilha e almíscar." },
    image: "img/products/maahir-gold.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 15
  },
  {
    id: "maahir-black", brand: "Lattafa", name: "Maahir Black Edition", category: "masculino",
    families: ["oriental"], price: null, soldOut: true,
    notes: { topo: "Pimenta-rosa, pimenta-preta e açafrão.", coracao: "Ruibarbo, cade, ládano e bálsamo de gurjum.", fundo: "Couro, cedro, patchouli, guáiaco, almíscar e musgo." },
    image: "img/products/maahir-black.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 15
  },
  {
    id: "musamam-white", brand: "Lattafa", name: "Musamam White Intense", category: "feminino",
    families: ["oriental", "citrico"], price: 389,
    notes: { topo: "Especiarias, bergamota e laranja.", coracao: "Coco, ylang-ylang, ambroxan e mahonial.", fundo: "Sândalo, almíscar e benjoim." },
    image: "img/products/musamam-white.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 17
  },
  {
    id: "atheeri", brand: "Lattafa", name: "Atheeri", category: "feminino",
    families: ["floral"], price: 589,
    notes: { topo: "Flor de maracujá e gotas de orvalho.", coracao: "Orquídea e jasmim.", fundo: "Baunilha e madeira âmbar." },
    image: "img/products/atheeri.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 17
  },
  {
    id: "raheeq", brand: "Nusuk", name: "Raheeq", category: "feminino",
    families: ["gourmand"], price: null, soldOut: true,
    notes: { topo: "Mel, laranja-sanguínea, damasco e limão.", coracao: "Caramelo, coco e magnólia.", fundo: "Baunilha absoluta, sândalo e almíscar." },
    image: "img/products/raheeq.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 17
  },
  {
    id: "afeef", brand: "Lattafa", name: "Afeef", category: "feminino",
    families: ["floral"], price: 549,
    notes: { topo: "Pêssego, pimenta-rosa e bergamota.", coracao: "Tuberosa, flor de laranjeira e jasmim.", fundo: "Pralinê, âmbar, sândalo e patchouli." },
    image: "img/products/afeef.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 18
  },
  {
    id: "la-vivacite", brand: "Maison Alhambra", name: "La Vivacité", category: "feminino",
    families: ["floral", "gourmand"], price: 349,
    notes: { topo: "Groselha-preta e pera.", coracao: "Íris, flor de laranjeira e jasmim.", fundo: "Patchouli, pralinê, fava-tonka e baunilha." },
    image: "img/products/la-vivacite.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 18
  },
  {
    id: "fakhar-rose", brand: "Lattafa", name: "Fakhar Rose (frasco branco)", category: "feminino",
    families: ["floral"], price: 369,
    notes: { topo: "Frutas, lírio, romã e aldeídos.", coracao: "Tuberosa, jasmim, gardênia, rosa e peônia.", fundo: "Baunilha, almíscar branco, sândalo e ambroxan." },
    image: "img/products/fakhar-rose.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 18
  },
  {
    id: "shagaf-al-ward", brand: "Al Wataniah", name: "Shagaf Al Ward", category: "feminino",
    families: ["floral"], price: 219, soldOut: true,
    notes: { topo: "Rosa de maio, jasmim e osmanthus.", coracao: "Narciso e tuberosa indiana.", fundo: "Âmbar e cedro." },
    image: "img/products/shagaf-al-ward.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 19
  },
  {
    id: "sabah-al-ward-sugar", brand: "Al Wataniah", name: "Sabah Al Ward Sugar", category: "feminino",
    families: ["frutado", "floral"], price: 219, soldOut: true,
    notes: { topo: "Morango, framboesa, groselha, mirtilo e cereja.", coracao: "Violeta e jasmim.", fundo: "Rosa, baunilha, âmbar, almíscar e patchouli." },
    image: "img/products/sabah-al-ward-sugar.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 19
  },
  {
    id: "sabah-al-ward", brand: "Al Wataniah", name: "Sabah Al Ward", category: "feminino",
    families: ["floral", "gourmand"], price: 219,
    notes: { topo: "Pimenta-rosa e mandarina.", coracao: "Cacau, flor de laranjeira e jasmim sambac.", fundo: "Baunilha, fava-tonka e patchouli." },
    image: "img/products/sabah-al-ward.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 20
  },
  {
    id: "cdn-maleka", brand: "Armaf", name: "Club de Nuit Maleka", category: "feminino",
    families: ["floral"], price: 389,
    notes: { topo: "Lichia, bergamota e pimenta-rosa.", coracao: "Íris.", fundo: "Pralinê, ambroxan e sândalo." },
    image: "img/products/cdn-maleka.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 20
  },
  {
    id: "yara", brand: "Lattafa", name: "Yara", category: "feminino",
    families: ["floral"], price: 279, oldPrice: 319,
    notes: { topo: "Orquídea, heliotrópio e mandarina.", coracao: "Acorde gourmand e frutas tropicais.", fundo: "Baunilha, almíscar e sândalo." },
    image: "img/products/yara.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 20
  },
  {
    id: "ameer-al-oudh", brand: "Lattafa", name: "Ameer Al Oudh Intense Oud", category: "feminino",
    families: ["amadeirado", "gourmand"], price: 239,
    notes: { topo: "Notas amadeiradas e oud.", coracao: "Açúcar e baunilha.", fundo: "Oud, sândalo e notas herbais." },
    image: "img/products/ameer-al-oudh.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 21
  },
  {
    id: "ameerati", brand: "Al Wataniah", name: "Ameerati", category: "feminino",
    families: ["citrico", "aromatico"], price: 239,
    notes: { topo: "Almíscar, notas verdes e cítricos.", coracao: "Notas herbais e amadeiradas.", fundo: "Notas atalcadas e especiadas." },
    image: "img/products/ameerati.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 21
  },
  {
    id: "royal-amber", brand: "Orientica", name: "Royal Amber", category: "feminino",
    families: ["frutado", "gourmand"], price: 569,
    notes: { topo: "Bergamota e notas verdes.", coracao: "Melão, abacaxi, âmbar e notas doces.", fundo: "Almíscar, madeiras e baunilha." },
    image: "img/products/royal-amber.jpg", bottle: { bg: ["#f0a35c", "#6b2e12"] }, // pág. 21
  },
  {
    id: "haya", brand: "Lattafa", name: "Haya", category: "feminino",
    families: ["floral"], price: 369,
    notes: { topo: "Champanhe, morango, mandarina, laranja-sanguínea e rosa.", coracao: "Gardênia, jasmim e orquídea-baunilha.", fundo: "Âmbar, sândalo e castanha." },
    image: "img/products/haya.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 22
  },
  {
    id: "raneen", brand: "Lattafa", name: "Raneen", category: "feminino",
    families: ["floral", "oriental"], price: 379,
    notes: { topo: "Goiaba, toranja-rosa, lichia e pimenta-rosa.", coracao: "Rosa, peônia e magnólia.", fundo: "Couro, âmbar-cinzento, almíscar, baunilha e musgo." },
    image: "img/products/raneen.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 22
  },
  {
    id: "marshmallow-blush", brand: "Paris Corner", name: "Marshmallow Blush", category: "feminino",
    families: ["gourmand", "frutado"], price: 329,
    notes: { topo: "Morango, framboesa e limão.", coracao: "Ambroxan e flor de laranjeira.", fundo: "Marshmallow, baunilha e almíscar." },
    image: "img/products/marshmallow-blush.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 22
  },
  {
    id: "leonie", brand: "Maison Alhambra", name: "Léonie", category: "feminino",
    families: ["floral", "aromatico"], price: 439,
    notes: { topo: "Lavanda, mandarina, petitgrain e groselha-preta.", coracao: "Lavanda, flor de laranjeira e jasmim.", fundo: "Almíscar, baunilha, cedro e âmbar-cinzento." },
    image: "img/products/leonie.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 23
  },
  {
    id: "cdn-woman", brand: "Armaf", name: "Club de Nuit Woman", category: "feminino",
    families: ["floral", "citrico"], price: 389,
    notes: { topo: "Laranja, bergamota, toranja e pêssego.", coracao: "Rosa, jasmim, gerânio e lichia.", fundo: "Patchouli, almíscar, baunilha e vetiver." },
    image: "img/products/cdn-woman.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 23
  },
  {
    id: "tharwah-gold", brand: "Lattafa", name: "Tharwah Gold", category: "feminino",
    families: ["floral"], price: 559,
    notes: { topo: "Lavanda e bergamota.", coracao: "Flor de laranjeira e jasmim egípcio.", fundo: "Baunilha, âmbar e vetiver." },
    image: "img/products/tharwah-gold.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 23
  },
  {
    id: "eclaire", brand: "Lattafa", name: "Eclaire", category: "feminino",
    families: ["gourmand"], price: 369, oldPrice: 429,
    notes: { topo: "Caramelo, leite e açúcar.", coracao: "Mel e flores brancas.", fundo: "Baunilha, pralinê e almíscar." },
    image: "img/products/eclaire.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 24
  },
  {
    id: "vulcan-feu", brand: "French Avenue", name: "Vulcan Feu", category: "feminino",
    families: ["floral", "oriental"], price: 429,
    notes: { topo: "Manga, limão, gengibre e ruibarbo.", coracao: "Pimenta-rosa, jasmim, violeta e pralinê.", fundo: "Fava-tonka, cedro, âmbar-cinzento e musgo." },
    image: "img/products/vulcan-feu.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 24
  },
  {
    id: "queen-of-arabia", brand: "Lattafa", name: "Queen of Arabia", category: "feminino",
    families: ["amadeirado"], price: null, soldOut: true,
    notes: { topo: "Coco e sal.", coracao: "Heliotrópio e sândalo.", fundo: "Baunilha e âmbar seco." },
    image: "img/products/queen-of-arabia.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 24
  },
  {
    id: "hawas-elixir", brand: "Rasasi", name: "Hawas Elixir", category: "feminino",
    families: ["gourmand", "aromatico"], price: null, soldOut: true,
    notes: { topo: "Hortelã, bergamota e artemísia.", coracao: "Chocolate amargo, lavanda e benjoim.", fundo: "Baunilha, fava-tonka e almíscar branco." },
    image: "img/products/hawas-elixir.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 25
  },
  {
    id: "dalal", brand: "Al-Rehab", name: "Dalal", category: "feminino",
    families: ["floral", "gourmand"], price: null, soldOut: true,
    notes: { topo: "Caramelo e ameixa.", coracao: "Flor de laranjeira, jasmim e rosa.", fundo: "Fava-tonka, sândalo, almíscar e cedro." },
    image: "img/products/dalal.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 25
  },
  {
    id: "victoria", brand: "Lattafa", name: "Victoria", category: "feminino",
    families: ["gourmand"], price: 329,
    notes: { topo: "Lemon meringue pie.", coracao: "Néroli.", fundo: "Baunilha." },
    image: "img/products/victoria.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 25
  },
  {
    id: "fakhar-rose-2", brand: "Lattafa", name: "Fakhar Rose (frasco rosé)", category: "feminino",
    families: ["floral"], price: 319,
    notes: { topo: "Frutas, lírio, romã e aldeídos.", coracao: "Tuberosa, jasmim, gardênia, ylang-ylang, rosa, madressilva e peônia.", fundo: "Baunilha, almíscar branco, sândalo e ambroxan." },
    image: "img/products/fakhar-rose-2.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 26
  },
  {
    id: "yara-tous", brand: "Lattafa", name: "Yara Tous", category: "feminino",
    families: ["floral", "frutado"], price: 269,
    notes: { topo: "Coco, manga e maracujá.", coracao: "Jasmim, heliotrópio e flor de laranjeira.", fundo: "Cashmeran, baunilha e almíscar." },
    image: "img/products/yara-tous.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 26
  },
  {
    id: "angham", brand: "Lattafa", name: "Angham", category: "feminino",
    families: ["gourmand", "oriental"], price: 349,
    notes: { topo: "Gengibre, mandarina e pimenta-rosa.", coracao: "Lavanda, pralinê, cacau e jasmim.", fundo: "Baunilha, âmbar e almíscar." },
    image: "img/products/angham.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 26
  },
  {
    id: "yara-moi", brand: "Lattafa", name: "Yara Moi", category: "feminino",
    families: ["floral"], price: 269,
    notes: { topo: "Pera, pimenta-rosa e groselha-preta.", coracao: "Tuberosa, jasmim e amêndoa.", fundo: "Baunilha, cashmeran e patchouli." },
    image: "img/products/yara-moi.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 27
  },
  {
    id: "sehr", brand: "Lattafa", name: "Sehr", category: "feminino",
    families: ["gourmand", "floral"], price: 369,
    notes: { topo: "Canela e amêndoa amarga.", coracao: "Jasmim, pomarose e akigalawood.", fundo: "Baunilha absoluta, fava-tonka e âmbar." },
    image: "img/products/sehr.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 27
  },
  {
    id: "infinity-gold", brand: "Armaf", name: "Infinity Gold", category: "feminino",
    families: ["floral"], price: null, soldOut: true,
    notes: { topo: "Pera, lavanda, rosa.", coracao: "Ylang-ylang, jasmim.", fundo: "Baunilha, musk, musgo." },
    image: "img/products/infinity-gold.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 27
  },
  {
    id: "shaari", brand: "Lattafa", name: "Shaari", category: "feminino",
    families: ["oriental"], price: 379,
    notes: { topo: "Oud, açafrão e canela.", coracao: "Sândalo e rosa.", fundo: "Couro, incenso, âmbar, baunilha e almíscar." },
    image: "img/products/shaari.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 28
  },
  {
    id: "durrat-al-aroos", brand: "Al Wataniah", name: "Durrat Al Aroos", category: "feminino",
    families: ["oriental", "gourmand"], price: 249,
    notes: { topo: "Almíscar branco e óleo de cipriol.", coracao: "Baunilha, cardamomo e açafrão.", fundo: "Fava-tonka e madeira guaiac." },
    image: "img/products/durrat-al-aroos.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 28
  },
  {
    id: "cdn-woman-extrait", brand: "Armaf", name: "Club de Nuit Woman Extrait", category: "feminino",
    families: ["floral", "citrico"], price: 449.99,
    notes: { topo: "Laranja, pêssego, grapefruit e bergamota.", coracao: "Rosa, gerânio, jasmim e lichia.", fundo: "Patchouli, vetiver, almíscar e baunilha." },
    image: "img/products/cdn-woman-extrait.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 28
  },
  {
    id: "24-carat", brand: "Lattafa", name: "24 Carat Pure Gold", category: "feminino",
    families: ["oriental"], price: 249,
    notes: { topo: "Oud, açafrão e canela.", coracao: "Rosa e sândalo.", fundo: "Couro, incenso, almíscar, âmbar e baunilha." },
    image: "img/products/24-carat.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 29
  },
  {
    id: "milena", brand: "Ard Al Zaafaran", name: "Milena", category: "feminino",
    families: ["floral"], price: null, soldOut: true,
    notes: { topo: "Flor de laranjeira, bergamota, limão, maçã verde.", coracao: "Jasmim, ylang-ylang, lavanda, rosa.", fundo: "Baunilha, musk, sândalo, patchouli, âmbar." },
    image: "img/products/milena.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 29
  },
  {
    id: "supremacy-gala", brand: "Afnan", name: "Supremacy Gala", category: "feminino",
    families: ["gourmand", "floral"], price: 349,
    notes: { topo: "Flor de pera, frutas vermelhas e mandarina.", coracao: "Gardênia, frangipani e madressilva.", fundo: "Baunilha, açúcar mascavo, caramelo, pralinê e patchouli." },
    image: "img/products/supremacy-gala.jpg", bottle: { bg: ["#e9c79a", "#5a3a1c"] }, // pág. 29
  },
  {
    id: "ser-al-khulood", brand: "Lattafa", name: "Ser Al Khulood", category: "feminino",
    families: ["oriental"], price: 349,
    notes: { topo: "Cardamomo, pimenta.", coracao: "Benjoim, rosa, gerânio.", fundo: "Âmbar, oud, cedro, incenso." },
    image: "img/products/ser-al-khulood.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 30
  },
  {
    id: "sheikh-al-shuyukh", brand: "Lattafa", name: "Sheikh Al Shuyukh", category: "feminino",
    families: ["citrico", "aromatico"], price: 349.99,
    notes: { topo: "Frutas cítricas, capim-limão, cedro.", coracao: "Sálvia, lavanda, alecrim.", fundo: "Patchouli, oud, almíscar." },
    image: "img/products/sheikh-al-shuyukh.jpg", bottle: { bg: ["#e6c34a", "#5a4a12"] }, // pág. 30
  },
  {
    id: "habik", brand: "Lattafa", name: "Habik for Women", category: "feminino",
    families: ["floral"], price: 319,
    notes: { topo: "Bergamota, pera.", coracao: "Jasmim, lírio-do-vale, frésia.", fundo: "Almíscar, âmbar seco, musgo de carvalho." },
    image: "img/products/habik.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 30
  },
  {
    id: "laventure-femme", brand: "Al Haramain", name: "L’aventure Femme", category: "feminino",
    families: ["amadeirado", "floral"], price: null, soldOut: true,
    notes: { topo: "Bergamota, groselha-preta e abacaxi.", coracao: "Rosa, frésia e cedro.", fundo: "Sândalo, patchouli, almíscar e âmbar." },
    image: "img/products/laventure-femme.jpg", bottle: { bg: ["#8a5a2b", "#2a1a0e"] }, // pág. 31
  },
  {
    id: "creme-precieux", brand: "Armaf", name: "Body Cream Club de Nuit Précieux I", category: "hidratantes",
    families: ["oriental", "gourmand"], price: 169,
    notes: { topo: "Abacaxi, limão, bergamota, pera e pimentas.", coracao: "Musgo, madeiras brancas, jasmim e anis.", fundo: "Ambroxan, cedro, patchouli, âmbar e baunilha." },
    image: "img/products/creme-precieux.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 33
  },
  {
    id: "creme-asad", brand: "Lattafa", name: "Body Cream Asad", category: "hidratantes",
    families: ["oriental"], price: 169,
    notes: { topo: "Pimenta-preta, tabaco e abacaxi.", coracao: "Patchouli, café e íris.", fundo: "Baunilha, âmbar, madeiras secas, benjoim e ládano." },
    image: "img/products/creme-asad.jpg", bottle: { bg: ["#d9822b", "#3d1d08"] }, // pág. 33
  },
  {
    id: "creme-sabah", brand: "Al Wataniah", name: "Body Cream Sabah Al Ward", category: "hidratantes",
    families: ["floral", "gourmand"], price: 169,
    notes: { topo: "Pimenta-rosa e mandarina.", coracao: "Cacau, flor de laranjeira e jasmim sambac.", fundo: "Baunilha, fava-tonka e patchouli." },
    image: "img/products/creme-sabah.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 33
  },
  {
    id: "creme-angel", brand: "Body Cream", name: "Angel", category: "hidratantes",
    families: [], price: 199,
    desc: "Hidratante corporal perfumado. Consulte as notas no WhatsApp.",
    image: "img/products/creme-angel.jpg", bottle: { bg: ["#d8b25a", "#2e1c08"] }, // pág. 34
  },
  {
    id: "creme-fakhar", brand: "Lattafa", name: "Body Cream Fakhar Rose", category: "hidratantes",
    families: ["floral"], price: 169,
    notes: { topo: "Frutas, lírio, romã e aldeídos.", coracao: "Tuberosa, jasmim, gardênia, rosa e peônia.", fundo: "Baunilha, almíscar branco, sândalo e ambroxan." },
    image: "img/products/creme-fakhar.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 34
  },
  {
    id: "creme-yara", brand: "Lattafa", name: "Body Cream Yara", category: "hidratantes",
    families: ["floral"], price: 169,
    notes: { topo: "Orquídea, heliotrópio e mandarina.", coracao: "Acorde gourmand e frutas tropicais.", fundo: "Baunilha, almíscar e sândalo." },
    image: "img/products/creme-yara.jpg", bottle: { bg: ["#e8a3b3", "#5b2433"] }, // pág. 34
  },
  {
    id: "vs-body-splash", brand: "Victoria's Secret", name: "Body Splash", category: "body-splash",
    families: [], price: 139,
    desc: "Bruma perfumada para o corpo. Consulte as fragrâncias disponíveis.",
    image: "img/products/vs-body-splash.jpg", bottle: { bg: ["#d8b25a", "#2e1c08"] }, // pág. 36
  },
  {
    id: "vs-hidratante", brand: "Victoria's Secret", name: "Hidratante", category: "hidratantes",
    families: [], price: 169,
    desc: "Loção corporal perfumada. Consulte as fragrâncias disponíveis.",
    image: "img/products/vs-hidratante.jpg", bottle: { bg: ["#d8b25a", "#2e1c08"] }, // pág. 36
  },
  {
    id: "vs-kit", brand: "Victoria's Secret", name: "Body Splash + Hidratante", category: "body-splash",
    families: [], price: 229,
    desc: "Kit com body splash e hidratante da mesma fragrância.",
    image: "img/products/vs-kit.jpg", bottle: { bg: ["#d8b25a", "#2e1c08"] }, // pág. 36
  },
  {
    id: "infantil", brand: "Sillage", name: "Perfume Infantil", category: "infantil",
    families: [], price: 199,
    desc: "Fragrância suave para os pequenos. Consulte as opções.",
    image: "img/products/infantil.jpg", bottle: { bg: ["#d8b25a", "#2e1c08"] }, // pág. 38
  },
];

/* Carrossel do topo.
   action: "#ancora" rola até a seção; "whatsapp" abre a conversa com a mensagem.
   filter (opcional): ativa o filtro de família ao clicar. product: id do frasco exibido. */
const SLIDES = [
  {
    eyebrow: "Sillage Perfumes Importados",
    title: ["Perfumaria árabe", "importada"],
    text: "Lattafa, Armaf, Afnan, French Avenue e outras casas do Oriente Médio. Fragrâncias marcantes que deixam rastro por onde você passa.",
    cta: "Ver perfumes", action: "#perfumes", product: "khamrah",
  },
  {
    eyebrow: "Família Yara",
    title: ["Doce, floral", "inesquecível"],
    text: "Yara, Yara Tous e Yara Moi: orquídea, frutas tropicais e baunilha cremosa. Yara de R$ 319 por R$ 279.",
    cta: "Ver os florais", action: "#perfumes", filter: "floral", product: "yara",
  },
  {
    eyebrow: "Gourmand",
    title: ["Eclaire", "em promoção"],
    text: "Caramelo, leite, mel e baunilha num perfume que parece sobremesa. De R$ 429 por R$ 369.",
    cta: "Ver os gourmands", action: "#perfumes", filter: "gourmand", product: "eclaire",
  },
  {
    eyebrow: "Encontre a sua",
    title: ["Por família", "olfativa"],
    text: "Amadeirado, cítrico, floral, oriental… Escolha o estilo que combina com você e veja as opções.",
    cta: "Explorar fragrâncias", action: "#fragrancias", product: "the-kingdom",
  },
  {
    eyebrow: "Atendimento personalizado",
    title: ["Peça pelo", "WhatsApp"],
    text: "Monte sua sacola no site e finalize com a gente. Tiramos dúvidas e indicamos o perfume ideal para você.",
    cta: "Chamar no WhatsApp", action: "whatsapp", message: "Olá, Sillage! Vim pelo site e gostaria de uma indicação de perfume ✨",
    product: "cdn-intense",
  },
];

/* Blocos da seção Instagram (ids de PRODUCTS). Todos linkam o perfil.
   Quando houver fotos reais, troque por { image, alt }. */
const INSTAGRAM_TILES = ["atheeri", "afeef", "fakhar-rose", "yara", "khamrah", "yara-tous", "yara-moi", "the-kingdom"];

/* Seção "Destaque da casa": um perfume em evidência com a pirâmide olfativa. */
const SPOTLIGHT = {
  product: "khamrah",
  title: "O calor das especiarias",
  text: "Um dos árabes mais desejados do mundo. Abre com canela e noz-moscada, aquece com tâmara e praliné e termina num fundo cremoso de baunilha e âmbar. Perfeito para noites frias e ocasiões especiais.",
  facts: ["Fixação prolongada", "Projeção marcante", "Outono e inverno"],
};

/* Faixa animada logo abaixo do carrossel. */
const MARQUEE = ["Lattafa", "Armaf", "Afnan", "French Avenue", "Maison Alhambra", "Al Wataniah", "Rasasi", "Rayhaan", "Orientica", "Paris Corner"];
