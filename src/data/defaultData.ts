import { Deus, Ramo, Poder, Monstro, MonstroPoder } from '../types';

export const INITIAL_DEUSES: Deus[] = [
  {
    id: 'poseidon',
    nome_grego_romano: 'Poseidon / Netuno',
    cor_hex: '#0ea5e9', // Azul Oceano
    imagem_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
    simbolo: 'trident-shield',
    icone_css: 'trident-shield',
    atributos_principais: 'Natureza / Força',
    descricao: 'Senhor dos Mares, Terremotos, Cavalos e Tempestades Oceânicas. Seus filhos possuem maestria com a água, vigor aprimorado quando molhados e controle geológico.',
    titulo_mitologico: 'O Abalador da Terra, Rei dos Oceanos',
    dificuldade: 2
  },
  {
    id: 'zeus',
    nome_grego_romano: 'Zeus / Júpiter',
    cor_hex: '#38bdf8', // Azul Elétrico / Céu
    imagem_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60',
    simbolo: 'bolt-shield',
    icone_css: 'bolt-shield',
    atributos_principais: 'Natureza / Poder Mágico',
    descricao: 'Rei dos Deuses, Senhor dos Céus e das Tempestades Elétricas. Seus semideuses dominam a aerocinese, relâmpagos e possuem liderança inata.',
    titulo_mitologico: 'Rei do Olimpo, Soberano dos Céus',
    dificuldade: 2
  },
  {
    id: 'hades',
    nome_grego_romano: 'Hades / Plutão',
    cor_hex: '#a855f7', // Roxo Sombrio / Obsidiana
    imagem_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    simbolo: 'skull-shield',
    icone_css: 'skull-shield',
    atributos_principais: 'Poder Mágico / Vitalidade',
    descricao: 'Senhor do Submundo, dos Mortos e de todas as Riquezas Minerais da Terra. Seus filhos comandam sombras, ossos e manipulam metais subterrâneos.',
    titulo_mitologico: 'O Invisível, Senhor do Érebo',
    dificuldade: 3
  },
  {
    id: 'atena',
    nome_grego_romano: 'Atena / Minerva',
    cor_hex: '#f59e0b', // Dourado Coruja / Âmbar
    imagem_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500&auto=format&fit=crop&q=60',
    simbolo: 'roman-shield',
    icone_css: 'roman-shield',
    atributos_principais: 'Intelecto / Agilidade',
    descricao: 'Deusa da Sabedoria, Estratégia de Batalha, Artesanato e Justiça. Seus filhos são gênios táticos, mestres no combate analítico e arquitetura.',
    titulo_mitologico: 'A de Olhos Cinzentos, Deusa da Estratégia',
    dificuldade: 3
  },
  {
    id: 'ares',
    nome_grego_romano: 'Ares / Marte',
    cor_hex: '#ef4444', // Vermelho Sangue
    imagem_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60',
    simbolo: 'battle-axe',
    icone_css: 'battle-axe',
    atributos_principais: 'Força / Vitalidade',
    descricao: 'Deus da Guerra Selvagem, Força Bruta e Frenesi de Batalha. Seus guerreiros possuem vigor descomunal, fúria e domínio perfeito de qualquer arma.',
    titulo_mitologico: 'O Destruidor de Cidades, Senhor da Guerra',
    dificuldade: 1
  },
  {
    id: 'apolo',
    nome_grego_romano: 'Apolo / Febo',
    cor_hex: '#eab308', // Amarelo Solar
    imagem_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=60',
    simbolo: 'barbed-sun',
    icone_css: 'barbed-sun',
    atributos_principais: 'Agilidade / Poder Mágico',
    descricao: 'Deus da Luz Solar, Música, Poesia, Profecia, Arquearia e Medicina. Seus semideuses são arqueiros infalíveis, curandeiros e canalizam o brilho solar.',
    titulo_mitologico: 'O Arqueiro Brilhante, Deus da Verdade e Cura',
    dificuldade: 1
  },
  {
    id: 'hefesto',
    nome_grego_romano: 'Hefesto / Vulcano',
    cor_hex: '#f97316', // Laranja Forja / Magma
    imagem_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=500&auto=format&fit=crop&q=60',
    simbolo: 'anvil',
    icone_css: 'anvil',
    atributos_principais: 'Força / Intelecto',
    descricao: 'Senhor do Fogo, Vulcões, Metalurgia e Forjas Divinas. Seus filhos possuem imunidade a altas temperaturas, telecinese mecânica e perícia em forja.',
    titulo_mitologico: 'O Grande Artífice do Olimpo',
    dificuldade: 2
  },
  {
    id: 'afrodite',
    nome_grego_romano: 'Afrodite / Vênus',
    cor_hex: '#ec4899', // Rosa Charme
    imagem_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=60',
    simbolo: 'heart-necklace',
    icone_css: 'heart-necklace',
    atributos_principais: 'Carisma / Poder Mágico',
    descricao: 'Deusa do Amor, Beleza, Paixão e Desejo. Seus filhos dominam a persuasão sobrenatural (Charmspeak), ilusões de beleza e aura atordoante.',
    titulo_mitologico: 'A Nascida da Espuma, Senhora do Desejo',
    dificuldade: 1
  },
  {
    id: 'hermes',
    nome_grego_romano: 'Hermes / Mercúrio',
    cor_hex: '#14b8a6', // Verde Turquesa / Vento
    imagem_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&auto=format&fit=crop&q=60',
    simbolo: 'winged-shield',
    icone_css: 'winged-shield',
    atributos_principais: 'Agilidade / Destreza',
    descricao: 'Mensageiro dos Deuses, Patrono dos Viajantes, Ladrões, Comércio e Eloquência. Seus filhos são velozes, destrancam qualquer fechadura e são astutos.',
    titulo_mitologico: 'O Guia das Almas, Senhor da Agilidade',
    dificuldade: 1
  },
  {
    id: 'hecate',
    nome_grego_romano: 'Hécate / Trívia',
    cor_hex: '#6366f1', // Índigo Mágico / Névoa
    imagem_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    simbolo: 'magic-portal',
    icone_css: 'magic-portal',
    atributos_principais: 'Poder Mágico / Intelecto',
    descricao: 'Deusa da Magia, Bruxaria, Encruzilhadas e da Névoa (Mist). Seus descendentes manipulam feitiços arcanos, poções e controlam a realidade mortal.',
    titulo_mitologico: 'Senhora das Encruzilhadas e da Névoa',
    dificuldade: 3
  },
  {
    id: 'demeter',
    nome_grego_romano: 'Deméter / Ceres',
    cor_hex: '#84cc16', // Verde Natureza / Espiga
    imagem_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60',
    simbolo: 'wheat',
    icone_css: 'wheat',
    atributos_principais: 'Natureza / Vitalidade',
    descricao: 'Deusa da Agricultura, Colheitas, Fertilidade e Estações. Seus filhos controlam plantas, raízes esmagadoras e regeneração natural.',
    titulo_mitologico: 'A Provedora de Frutos, Senhora da Colheita',
    dificuldade: 1
  },
  {
    id: 'dionisio',
    nome_grego_romano: 'Dionísio / Baco',
    cor_hex: '#8b5cf6', // Violeta Vinha / Púrpura
    imagem_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=60',
    simbolo: 'grapes',
    icone_css: 'grapes',
    atributos_principais: 'Carisma / Poder Mágico',
    descricao: 'Deus do Vinho, Festas, Loucura e Teatro. Seus filhos induzem euforia, confusão mental desorientadora e manipulam videiras monstruosas.',
    titulo_mitologico: 'O Libertador, Senhor do Delírio',
    dificuldade: 2
  }
];

export const INITIAL_RAMOS: Ramo[] = [
  // Poseidon Ramos
  { id: 'pos_tronco', deus_id: 'poseidon', tipo: 'tronco', nome: 'Tronco: Herança Abissal', descricao: 'Poderes essenciais e passivos concedidos a todos os herdeiros do oceano.' },
  { id: 'pos_ramo1', deus_id: 'poseidon', tipo: 'ramo1', nome: 'Ramo 1: Hidrocinese & Torrentes', descricao: 'Controle ativo da água, jatos de alta pressão e construtos fluidos.' },
  { id: 'pos_ramo2', deus_id: 'poseidon', tipo: 'ramo2', nome: 'Ramo 2: Abalador de Terras', descricao: 'Ondas de choque sísmicas, fissuras tectônicas e força telúrica.' },
  { id: 'pos_ramo3', deus_id: 'poseidon', tipo: 'ramo3', nome: 'Ramo 3: Domínio Equino & Marítimo', descricao: 'Telepatia com criaturas aquáticas, equinos e navegação perfeita.' },

  // Zeus Ramos
  { id: 'zeus_tronco', deus_id: 'zeus', tipo: 'tronco', nome: 'Tronco: Sangue Celestial', descricao: 'Habilidades fundamentais de autoridade, eletricidade estática e leveza.' },
  { id: 'zeus_ramo1', deus_id: 'zeus', tipo: 'ramo1', nome: 'Ramo 1: Eletrocinese & Raios', descricao: 'Geração e projeção de descargas elétricas letais.' },
  { id: 'zeus_ramo2', deus_id: 'zeus', tipo: 'ramo2', nome: 'Ramo 2: Aerocinese & Voo', descricao: 'Manipulação de correntes de ar, ciclones e levitação tempestuosa.' },
  { id: 'zeus_ramo3', deus_id: 'zeus', tipo: 'ramo3', nome: 'Ramo 3: Aura de Comando', descricao: 'Presença dominante régia, intimidando inimigos e inspirando aliados.' },

  // Hades Ramos
  { id: 'had_tronco', deus_id: 'hades', tipo: 'tronco', nome: 'Tronco: Afinidade com o Submundo', descricao: 'Resistência ao frio espectral, detecção de mortes e aura aterrorizante.' },
  { id: 'had_ramo1', deus_id: 'hades', tipo: 'ramo1', nome: 'Ramo 1: Umbrocinese & Viagem pelas Sombras', descricao: 'Controle da escuridão, construtos de trevas e teleporte sombrio.' },
  { id: 'had_ramo2', deus_id: 'hades', tipo: 'ramo2', nome: 'Ramo 2: Necromancia & Almas', descricao: 'Evocação de esqueletos espartanos e comandos espectrais.' },
  { id: 'had_ramo3', deus_id: 'hades', tipo: 'ramo3', nome: 'Ramo 3: Geocinese & Metais Preciosos', descricao: 'Controle de jóias, ouro da terra e criação de fossos estígios.' },

  // Atena Ramos
  { id: 'atn_tronco', deus_id: 'atena', tipo: 'tronco', nome: 'Tronco: Mente Estratégica', descricao: 'Cálculo de combate instantâneo, memória eidética e foco inabalável.' },
  { id: 'atn_ramo1', deus_id: 'atena', tipo: 'ramo1', nome: 'Ramo 1: Tática & Previsão', descricao: 'Antecipação de golpes adversários e detecção de pontos fracos.' },
  { id: 'atn_ramo2', deus_id: 'atena', tipo: 'ramo2', nome: 'Ramo 2: Maestria Bélica', descricao: 'Uso magistral de escudos, lanças e adaptação marcial instantânea.' },
  { id: 'atn_ramo3', deus_id: 'atena', tipo: 'ramo3', nome: 'Ramo 3: Engenharia & Criação', descricao: 'Compreensão intuitiva de armadilhas, códigos e artefatos de guerra.' },

  // Ares Ramos
  { id: 'ares_tronco', deus_id: 'ares', tipo: 'tronco', nome: 'Tronco: Fúria de Batalha', descricao: 'Aumento de força e resistência física proporcional ao sangue derramado.' },
  { id: 'ares_ramo1', deus_id: 'ares', tipo: 'ramo1', nome: 'Ramo 1: Maestria Armamentista', descricao: 'Encantamento temporário de armas e manejo impecável de qualquer lâmina.' },
  { id: 'ares_ramo2', deus_id: 'ares', tipo: 'ramo2', nome: 'Ramo 2: Presença Agressiva & Medo', descricao: 'Indução de pânico e provocação irresistível no campo de batalha.' },
  { id: 'ares_ramo3', deus_id: 'ares', tipo: 'ramo3', nome: 'Ramo 3: Invulnerabilidade Bélica', descricao: 'Endurecimento muscular impenetrável e regeneração em combate.' },

  // Apolo Ramos
  { id: 'apo_tronco', deus_id: 'apolo', tipo: 'tronco', nome: 'Tronco: Radiância Solar', descricao: 'Imunidade à cegueira, vigor com luz diurna e sentidos aguçados.' },
  { id: 'apo_ramo1', deus_id: 'apolo', tipo: 'ramo1', nome: 'Ramo 1: Arquearia Infalível', descricao: 'Disparos curvos de flechas teleguiadas e tiros cegantes.' },
  { id: 'apo_ramo2', deus_id: 'apolo', tipo: 'ramo2', nome: 'Ramo 2: Hinologia & Medicina', descricao: 'Canções de sono, cura milagrosa de ferimentos e purificação de venenos.' },
  { id: 'apo_ramo3', deus_id: 'apolo', tipo: 'ramo3', nome: 'Ramo 3: Fotocinese & Calor', descricao: 'Projeção de feixes de luz cortante e calor abrasador.' },

  // Hefesto Ramos
  { id: 'hef_tronco', deus_id: 'hefesto', tipo: 'tronco', nome: 'Tronco: Filho da Forja', descricao: 'Resistência absoluta a chamas, intuição mecânica e força de ferreiro.' },
  { id: 'hef_ramo1', deus_id: 'hefesto', tipo: 'ramo1', nome: 'Ramo 1: Pirocinese Vulcânica', descricao: 'Criação e manipulação de labaredas e calor de fornalha.' },
  { id: 'hef_ramo2', deus_id: 'hefesto', tipo: 'ramo2', nome: 'Ramo 2: Autômatos & Engenhocas', descricao: 'Construção rápida de armadilhas, drones e despertar de autômatos.' },
  { id: 'hef_ramo3', deus_id: 'hefesto', tipo: 'ramo3', nome: 'Ramo 3: Metalocinese Estrutural', descricao: 'Manipulação de ligas metálicas, conserto instantâneo e reforço.' },

  // Afrodite Ramos
  { id: 'afr_tronco', deus_id: 'afrodite', tipo: 'tronco', nome: 'Tronco: Graça e Sedução', descricao: 'Aura hipnótica natural, persuasão mundana e leitura emocional.' },
  { id: 'afr_ramo1', deus_id: 'afrodite', tipo: 'ramo1', nome: 'Ramo 1: Charmspeak (Voz do Charme)', descricao: 'Comandos verbais encantados que forçam o alvo a obedecer.' },
  { id: 'afr_ramo2', deus_id: 'afrodite', tipo: 'ramo2', nome: 'Ramo 2: Ilusão Estética & Brilho', descricao: 'Distorção de silhueta, ofuscamento visual e atordoamento.' },
  { id: 'afr_ramo3', deus_id: 'afrodite', tipo: 'ramo3', nome: 'Ramo 3: Harmonia & Apaziguamento', descricao: 'Cancelamento de intenções hostis e regeneração emocional.' },

  // Hermes Ramos
  { id: 'her_tronco', deus_id: 'hermes', tipo: 'tronco', nome: 'Tronco: Astúcia do Mensageiro', descricao: 'Agilidade sobre-humana, mãos leves e destrancamento instintivo.' },
  { id: 'her_ramo1', deus_id: 'hermes', tipo: 'ramo1', nome: 'Ramo 1: Hiper-Velocidade', descricao: 'Corridas em alta velocidade, esquivas relâmpago e socos em rajada.' },
  { id: 'her_ramo2', deus_id: 'hermes', tipo: 'ramo2', nome: 'Ramo 2: Alquimia & Travessuras', descricao: 'Criação de bombas de fumaça, poções rápidas e truques ilusórios.' },
  { id: 'her_ramo3', deus_id: 'hermes', tipo: 'ramo3', nome: 'Ramo 3: Mestre das Trancas & Portais', descricao: 'Abertura remota de selos, fechaduras mágicas e pequenos bolsões dimensionais.' },

  // Hécate Ramos
  { id: 'hec_tronco', deus_id: 'hecate', tipo: 'tronco', nome: 'Tronco: Conexão com a Névoa', descricao: 'Visão através de ilusões mortais e canalização de energia mística.' },
  { id: 'hec_ramo1', deus_id: 'hecate', tipo: 'ramo1', nome: 'Ramo 1: Manipulação da Névoa', descricao: 'Criação de miragens complexas, invisibilidade e alteração de memórias.' },
  { id: 'hec_ramo2', deus_id: 'hecate', tipo: 'ramo2', nome: 'Ramo 2: Feitiçaria Ofensiva & Fogo Místico', descricao: 'Disparo de orbes de energia arcana, runas explosivas e feitiços arcanos.' },
  { id: 'hec_ramo3', deus_id: 'hecate', tipo: 'ramo3', nome: 'Ramo 3: Barreira & Encantamentos', descricao: 'Cúpulas mágicas protetoras, selamentos e encantamento de itens.' }
];

export const INITIAL_PODERES: Poder[] = [
  // Poseidon - Tronco (4 poderes)
  {
    id: 'pos_p1',
    ramo_id: 'pos_tronco',
    numero: 1,
    nome: 'Respiração & Nado Anfíbio',
    descricao_base: 'Capacidade inata de respirar sob a água e nadar em altíssima velocidade sem se cansar.',
    icone_url: 'waves',
    nivel_1_desc: 'O semideus pode respirar sob a água doce ou salgada indefinidamente e nada 2x mais rápido que um atleta mortal.',
    nivel_2_desc: 'Visão perfeita e cristalina em fossas abissais escuras. Suporta pressões marinhas esmagadoras de até 5.000m.',
    nivel_3_desc: 'Nado em velocidade de torpedo com manobras impossíveis. O personagem não se molha se assim desejar.'
  },
  {
    id: 'pos_p2',
    ramo_id: 'pos_tronco',
    numero: 2,
    nome: 'Vigor Hidratado',
    descricao_base: 'O contato com água fresca ou salgada regenera ferimentos e restaura o vigor físico do semideus.',
    icone_url: 'droplet',
    nivel_1_desc: 'Estar submerso fecha cortes leves, arranhões e alivia o cansaço acumulado após 1 turno.',
    nivel_2_desc: 'Cura fraturas leves, queimaduras e anula efeitos de venenos moderados em contato com água corrente.',
    nivel_3_desc: 'Regeneração acelerada em combate (+50% força e agilidade momentânea enquanto banhado em água).'
  },
  {
    id: 'pos_p3',
    ramo_id: 'pos_tronco',
    numero: 3,
    nome: 'Orientação Náutica & Carta Marítima',
    descricao_base: 'Sentido absoluto de localização geográfica quando em corpos d\'água ou a bordo de embarcações.',
    icone_url: 'compass',
    nivel_1_desc: 'Sabe instintivamente as coordenadas exatas, profundidade e correntes marinhas.',
    nivel_2_desc: 'Capacidade de pilotar qualquer embarcação (de canoas a navios de guerra) com maestria sobrenatural apenas com a mente.',
    nivel_3_desc: 'Detecta monstros e embarcações inimigas submersas num raio de 5km através de vibrações aquáticas.'
  },
  {
    id: 'pos_p4',
    ramo_id: 'pos_tronco',
    numero: 4,
    nome: 'Comunicação Equina & Ictiológica',
    descricao_base: 'Elo telepático com cavalos, pégasos, hipocampos e todos os peixes do reino marinho.',
    icone_url: 'shield',
    nivel_1_desc: 'Compreende e conversa telepaticamente com cavalos e criaturas do mar, ganhando sua simpatia.',
    nivel_2_desc: 'Pode convocar cardumes e cavalos selvagens para prestar auxílio em tarefas ou combate.',
    nivel_3_desc: 'Comando de feras marinhas colossais (como tubarões gigantes e lulas) para atacar frotas inimigas.'
  },

  // Poseidon - Ramo 1: Hidrocinese (4 poderes)
  {
    id: 'pos_p5',
    ramo_id: 'pos_ramo1',
    numero: 1,
    nome: 'Jato de Pressão Aquática',
    descricao_base: 'Dispara uma coluna de água sob altíssima pressão capaz de arremessar oponentes.',
    icone_url: 'zap',
    nivel_1_desc: 'Dispara jatos de até 10 metros que empurram inimigos de porte humano para trás.',
    nivel_2_desc: 'A pressão atinge nível industrial, capaz de amassar chapas de metal e derrubar portas blindadas.',
    nivel_3_desc: 'Jato laminar de água cortante que fatia aço e armaduras de bronze celestial como navalha.'
  },
  {
    id: 'pos_p6',
    ramo_id: 'pos_ramo1',
    numero: 2,
    nome: 'Escudo & Domo Hidrostático',
    descricao_base: 'Forma uma barreira giratória de água para repelir projéteis e feitiços.',
    icone_url: 'shield',
    nivel_1_desc: 'Ergue uma cortina d\'água que desvia flechas e projéteis balísticos comuns.',
    nivel_2_desc: 'Domo esférico completo que absorve explosões de fogo e repele ataques mágicos moderados.',
    nivel_3_desc: 'Escudo de vórtice que captura projéteis inimigos e os devolve com o dobro da velocidade.'
  },
  {
    id: 'pos_p7',
    ramo_id: 'pos_ramo1',
    numero: 3,
    nome: 'Prisão de Bolha Asfixiante',
    descricao_base: 'Envolve a cabeça ou corpo do adversário em uma esfera densa de água sem saída.',
    icone_url: 'cloud-rain',
    nivel_1_desc: 'Engloba a cabeça do alvo por 2 turnos, causando desespero e perda de ar.',
    nivel_2_desc: 'Prende o corpo inteiro do inimigo numa esfera flutuante, restringindo movimentos físicos.',
    nivel_3_desc: 'A água da prisão gira como centrífuga, esmagando a armadura e desacordando o alvo.'
  },
  {
    id: 'pos_p8',
    ramo_id: 'pos_ramo1',
    numero: 4,
    nome: 'Maremoto & Fúria de Tétis',
    descricao_base: 'Conjura uma muralha colossal de ondas que devasta todo o campo de batalha.',
    icone_url: 'anchor',
    nivel_1_desc: 'Onda de 3 metros que inunda a área e arrasta um grupo de inimigos.',
    nivel_2_desc: 'Muralha de 10 metros com força de tsunami, varrendo fortificações e afundando navios.',
    nivel_3_desc: 'Tsunami devastador que pode submergir um quarteirão inteiro ou varrer um exército de monstros.'
  },

  // Poseidon - Ramo 2: Abalador de Terras (4 poderes)
  {
    id: 'pos_p9',
    ramo_id: 'pos_ramo2',
    numero: 1,
    nome: 'Tremor Sísmico Local',
    descricao_base: 'Bate os pés ou a lança no chão provocando pequenas ondas de choque no solo.',
    icone_url: 'activity',
    nivel_1_desc: 'Desequilibra todos os adversários em um raio de 5 metros, derrubando-os ao solo.',
    nivel_2_desc: 'Gera pequenas rachaduras no chão que prendem os pés dos inimigos em terra ou rocha.',
    nivel_3_desc: 'Ondas sísmicas contínuas que estilhaçam o piso de pedra e desarmam guerreiros.'
  },
  {
    id: 'pos_p10',
    ramo_id: 'pos_ramo2',
    numero: 2,
    nome: 'Fissura Abissal',
    descricao_base: 'Abre uma fenda profunda na terra que pode engolir estruturas ou inimigos.',
    icone_url: 'flame',
    nivel_1_desc: 'Abre uma fenda de 1 metro de largura e 3 metros de profundidade sob o alvo.',
    nivel_2_desc: 'Fenda de 5 metros de profundidade que se fecha sob comando, esmagando o que estiver dentro.',
    nivel_3_desc: 'Cratera sísmica colapsando túneis subterrâneos e engolindo hordas inteiras.'
  },
  {
    id: 'pos_p11',
    ramo_id: 'pos_ramo2',
    numero: 3,
    nome: 'Impacto do Tridente Terrestre',
    descricao_base: 'Canaliza o poder das profundezas em um golpe corpo a corpo com força tectônica.',
    icone_url: 'crosshair',
    nivel_1_desc: 'O golpe do semideus carrega força de impacto dobrada com estalo sonoro.',
    nivel_2_desc: 'Estilhaça escudos de bronze e arremessa oponentes pesados a dezenas de metros.',
    nivel_3_desc: 'Golpe devastador que gera uma cratera de impacto e pulveriza rochas e armaduras reforçadas.'
  },
  {
    id: 'pos_p12',
    ramo_id: 'pos_ramo2',
    numero: 4,
    nome: 'Cataclismo de Encelado',
    descricao_base: 'Desperta a fúria máxima do Abalador da Terra, gerando um terremoto de magnitude devastadora.',
    icone_url: 'skull',
    nivel_1_desc: 'Terremoto de magnitude 5.0 derrubando árvores e estruturas frágeis.',
    nivel_2_desc: 'Terremoto de magnitude 7.0 derrubando muralhas de fortalezas e provocando deslizamentos de terra.',
    nivel_3_desc: 'Terremoto catastrófico de magnitude 9.0 com erupções de água do lençol freático e devastação total.'
  },

  // Poseidon - Ramo 3: Domínio Marítimo & Equino (4 poderes)
  {
    id: 'pos_p13',
    ramo_id: 'pos_ramo3',
    numero: 1,
    nome: 'Montaria Imparável',
    descricao_base: 'Conexão sublime com cavalos e criaturas equinas que aumenta o desempenho de ambos.',
    icone_url: 'sparkles',
    nivel_1_desc: 'A montaria nunca cansa em cavalgadas comuns e obedece a comandos mentais sutis.',
    nivel_2_desc: 'A montaria ganha velocidade ultrassônica momentânea e pode saltar abismos sem medo.',
    nivel_3_desc: 'A montaria é envolvida por uma armadura de névoa marinha, permitindo cavalgar sobre as águas.'
  },
  {
    id: 'pos_p14',
    ramo_id: 'pos_ramo3',
    numero: 2,
    nome: 'Invocação de Hipocampos',
    descricao_base: 'Chama espíritos equinos das águas para combate ou fuga rápida no oceano.',
    icone_url: 'feather',
    nivel_1_desc: 'Invoca 1 hipocampo ágil para transporte aquático seguro.',
    nivel_2_desc: 'Invoca uma parelha de hipocampos de guerra com mordidas letais e caudas de peixe cortantes.',
    nivel_3_desc: 'Comanda um esquadrão de hipocampos gigantes blindados para ataque anfíbio coordenado.'
  },
  {
    id: 'pos_p15',
    ramo_id: 'pos_ramo3',
    numero: 3,
    nome: 'Bênção de Anfitrite',
    descricao_base: 'Aura calmante das profundezas que regenera o ânimo de aliados próximos.',
    icone_url: 'heart',
    nivel_1_desc: 'Aliados a até 10m recuperam o fôlego e sentem alívio de exaustão térmica.',
    nivel_2_desc: 'Remove efeitos de desidratação, atordoamento e concede +20% de velocidade de movimento.',
    nivel_3_desc: 'Escudo aquático compartilhado para até 5 aliados que absorve 1 golpe mortal cada.'
  },
  {
    id: 'pos_p16',
    ramo_id: 'pos_ramo3',
    numero: 4,
    nome: 'Avatar do Kraken',
    descricao_base: 'Manifesta membros espectrais de lulas e monstros colossais das fossas marinhas.',
    icone_url: 'sun',
    nivel_1_desc: 'Invoca 2 tentáculos de água densa para imobilizar e arremessar inimigos.',
    nivel_2_desc: 'Invoca 4 tentáculos gigantes que esmagam carruagens e quebram asas de monstros voadores.',
    nivel_3_desc: 'Manifestação completa da bocarra do leviatã, devorando ataques mágicos e esmagando alvos múltiplos.'
  },

  // Zeus - Tronco (4 poderes)
  {
    id: 'zeus_p1',
    ramo_id: 'zeus_tronco',
    numero: 1,
    nome: 'Corpo Estático & Carga Elétrica',
    descricao_base: 'O semideus armazena eletricidade em suas células e é totalmente imune a choques e raios.',
    icone_url: 'zap',
    nivel_1_desc: 'Imunidade a choques elétricos e sensação de estática constante ao redor.',
    nivel_2_desc: 'Pode descarregar eletricidade estática ao tocar alvos, paralisando membros por 1 turno.',
    nivel_3_desc: 'Absorve eletricidade de fontes externas para recarregar suas forças e curar ferimentos.'
  },
  {
    id: 'zeus_p2',
    ramo_id: 'zeus_tronco',
    numero: 2,
    nome: 'Leveza dos Céus',
    descricao_base: 'A densidade do semideus responde à gravidade de maneira atenuada, evitando dano de queda.',
    icone_url: 'feather',
    nivel_1_desc: 'Quedas de até 20 metros são desaceleradas como se estivesse com paraquedas de ar.',
    nivel_2_desc: 'Saltos 3x mais altos e longos com pouso perfeitamente silencioso.',
    nivel_3_desc: 'Flutuação estática por tempo indeterminado e controle total de direção no ar.'
  },
  {
    id: 'zeus_p3',
    ramo_id: 'zeus_tronco',
    numero: 3,
    nome: 'Visão de Águia Imperial',
    descricao_base: 'Visão telescópica através de nuvens, neblina e detecção de variações de pressão.',
    icone_url: 'eye',
    nivel_1_desc: 'Enxerga alvos a até 2km de distância com nitidez cristalina.',
    nivel_2_desc: 'Capacidade de ver no escuro e através de névoa espessa sem perder foco.',
    nivel_3_desc: 'Enxerga fluxos de energia mágica e eletricidade no ar ao redor.'
  },
  {
    id: 'zeus_p4',
    ramo_id: 'zeus_tronco',
    numero: 4,
    nome: 'Presença Majestosa',
    descricao_base: 'Uma aura de autoridade divina que impõe respeito a mortais e semideuses.',
    icone_url: 'crown',
    nivel_1_desc: 'Monstros de menor escalão hesitam 1 turno antes de atacar o semideus.',
    nivel_2_desc: 'Voz ribombante como trovão distante que pode forçar rendição de oponentes fracos.',
    nivel_3_desc: 'Aura radiante que causa pânico temporário em inimigos e aumenta a moral de aliados em 50%.'
  },

  // Zeus - Ramo 1: Eletrocinese (4 poderes)
  {
    id: 'zeus_p5',
    ramo_id: 'zeus_ramo1',
    numero: 1,
    nome: 'Relâmpago da Palma',
    descricao_base: 'Dispara arcos elétricos concentrados diretamente das mãos.',
    icone_url: 'zap',
    nivel_1_desc: 'Arco elétrico de 10m que causa queimaduras e atordoa o alvo.',
    nivel_2_desc: 'Raio bifurcado que atinge até 3 alvos simultâneos com força paralisante.',
    nivel_3_desc: 'Descarga em cadeia de alta voltagem capaz de fundir metal e nocautear múltiplos monstros.'
  },
  {
    id: 'zeus_p6',
    ramo_id: 'zeus_ramo1',
    numero: 2,
    nome: 'Lança de Relâmpago',
    descricao_base: 'Condensa a eletricidade em uma lança luminosa sólida de puro plasma.',
    icone_url: 'crosshair',
    nivel_1_desc: 'Arremessa uma lança elétrica com precisão cirúrgica a até 30 metros.',
    nivel_2_desc: 'A lança explode em estilhaços elétricos no impacto, afetando área de 5m.',
    nivel_3_desc: 'Cria lanças duplas ou uma lança colossal com perfuração de barreiras mágicas.'
  },
  {
    id: 'zeus_p7',
    ramo_id: 'zeus_ramo1',
    numero: 3,
    nome: 'Armadura Voltaica',
    descricao_base: 'Cobre a pele e armadura com milhares de volts de energia protetora.',
    icone_url: 'shield',
    nivel_1_desc: 'Inimigos que tocam o semideus em combate corpo a corpo recebem choque defensivo.',
    nivel_2_desc: 'Desintegra flechas e projéteis que se aproximem do semideus em 2 metros.',
    nivel_3_desc: 'Explosão de choque omnidirecional ao ser atingido por golpe crítico.'
  },
  {
    id: 'zeus_p8',
    ramo_id: 'zeus_ramo1',
    numero: 4,
    nome: 'Julgamento do Trovão',
    descricao_base: 'Convoca um raio divino diretamente dos céus que pulveriza a área-alvo.',
    icone_url: 'flame',
    nivel_1_desc: 'Raio vertical de tempestade com estrondo ensurdecedor na posição inimiga.',
    nivel_2_desc: 'Chuva de 3 raios simultâneos destruindo carruagens e monstros colossais.',
    nivel_3_desc: 'O Raio Mestre em miniatura: desintegração total de alvos terrestres e cratera fumegante.'
  },

  // Hades - Tronco (4 poderes)
  {
    id: 'had_p1',
    ramo_id: 'had_tronco',
    numero: 1,
    nome: 'Sentido Tanático',
    descricao_base: 'Percepção inata de morte iminente, fantasmas e presença de almas ao redor.',
    icone_url: 'skull',
    nivel_1_desc: 'Detecta a presença de espíritos desencarnados e esqueletos em 50m.',
    nivel_2_desc: 'Sabe o estado de saúde exato e proximidade da morte de qualquer ser no campo.',
    nivel_3_desc: 'Comunica-se fluentemente com fantasmas antigos e obtém segredos do Submundo.'
  },
  {
    id: 'had_p2',
    ramo_id: 'had_tronco',
    numero: 2,
    nome: 'Frio Estígio',
    descricao_base: 'O corpo do semideus emana uma temperatura gélida que afeta o ambiente.',
    icone_url: 'snowflake',
    nivel_1_desc: 'Imune ao frio glacial e congela pequenas poças de água ao pisar.',
    nivel_2_desc: 'Aura que reduz a velocidade de ataque dos inimigos em volta em 25%.',
    nivel_3_desc: 'Congelamento necrótico em golpes de arma que impede cura de feridas.'
  },
  {
    id: 'had_p3',
    ramo_id: 'had_tronco',
    numero: 3,
    nome: 'Aura de Pavor Espectral',
    descricao_base: 'Uma presença opressiva que faz o sangue dos adversários gelar.',
    icone_url: 'eye',
    nivel_1_desc: 'Criaturas com pouca coragem fogem em pânico ao encarar o semideus.',
    nivel_2_desc: 'Gera alucinações de pesadelos fúnebres no oponente durante o combate.',
    nivel_3_desc: 'Paralisia por terror absoluto em um grupo de inimigos por 2 turnos.'
  },
  {
    id: 'had_p4',
    ramo_id: 'had_tronco',
    numero: 4,
    nome: 'Comunhão com Ferro Estígio',
    descricao_base: 'Afinidade mística com o metal negro do Submundo que absorve almas.',
    icone_url: 'shield',
    nivel_1_desc: 'Pode empunhar armas de Ferro Estígio sem sofrer drenagem de energia vital.',
    nivel_2_desc: 'Armas de Ferro Estígio em suas mãos brilham com chamas negras e causam +30% de dano.',
    nivel_3_desc: 'Ao derrotar um monstro, a arma absorve parte da essência para curar o semideus.'
  },

  // Hades - Ramo 1: Umbrocinese (4 poderes)
  {
    id: 'had_p5',
    ramo_id: 'had_ramo1',
    numero: 1,
    nome: 'Manto de Sombras',
    descricao_base: 'Camufla o semideus na escuridão, tornando-o quase invisível a olhos mortais e de monstros.',
    icone_url: 'moon',
    nivel_1_desc: 'Invisibilidade total em ambientes escuros ou na penumbra.',
    nivel_2_desc: 'Pode mover-se silenciosamente sem emitir cheiro ou pegadas enquanto camuflado.',
    nivel_3_desc: 'Desaparece instantaneamente em plena luz do dia fundindo-se à sua própria sombra.'
  },
  {
    id: 'had_p6',
    ramo_id: 'had_ramo1',
    numero: 2,
    nome: 'Tentáculos de Escuridão',
    descricao_base: 'Materializa gavinhas de trevas sólidas a partir do chão.',
    icone_url: 'activity',
    nivel_1_desc: 'Gavinhas que agarram os tornozelos de até 2 alvos a 10m de distância.',
    nivel_2_desc: 'Tentáculos espessos que erguem oponentes no ar e os asfixiam com frio espectral.',
    nivel_3_desc: 'Floresta de tentáculos negros que estilhaçam escudos e destroem fortificações.'
  },
  {
    id: 'had_p7',
    ramo_id: 'had_ramo1',
    numero: 3,
    nome: 'Projéteis da Noite Eterna',
    descricao_base: 'Dispara estacas sólidas de sombra condensada que perfuram defesas.',
    icone_url: 'crosshair',
    nivel_1_desc: 'Dispara 3 agulhas sombrias que penetram armaduras leves.',
    nivel_2_desc: 'Lança de sombra espessa que explode em névoa ofuscante no impacto.',
    nivel_3_desc: 'Chuva torrencial de lâminas de ébano cortando uma área de 15 metros.'
  },
  {
    id: 'had_p8',
    ramo_id: 'had_ramo1',
    numero: 4,
    nome: 'Viagem pelas Sombras (Shadow Travel)',
    descricao_base: 'Entra em uma sombra para reaparecer instantaneamente em outra sombra distante.',
    icone_url: 'sparkles',
    nivel_1_desc: 'Teleporte tático de curto alcance (até 20m) entre sombras visíveis.',
    nivel_2_desc: 'Teleporte de médio alcance (até 1km) levando até 1 passageiro consigo.',
    nivel_3_desc: 'Teleporte continental ou dimensional para o Submundo, com mínimo cansaço físico.'
  }
];

export const INITIAL_MONSTROS: Monstro[] = [
  {
    id: "dracaena",
    nome: "Dracaena",
    descricao: "A dracaena original roubou os cavalos de Héracles/Hércules e os devolveu em troca de uma noite com o semideus, o que resultou em três filhas. Na atualidade, são monstros muito comuns em todo o mundo, vivendo especialmente próximas a áreas florestadas e não se dando muito bem com o mundo urbano, embora se adaptem fácil. As dracaenae vivem em grupos controlados por rainhas e possuem uma rainha suprema, mas podem ser encontradas individualmente.",
    indole: "As dracaenae são inerentemente cruéis e predatórias. Criadas para matar, atacam tanto para se defender quanto por oportunismo, escolhendo alvos vulneráveis sempre que possível. Alimentam-se de carne e, após uma caçada bem-sucedida, são capazes de devorar um semideus inteiro.\n\nApesar de sua agressividade, não são criaturas especialmente inteligentes ou orgulhosas, o que as torna relativamente fáceis de manipular por meios psicológicos ou estratégicos. Ainda assim, subestimá-las costuma ser fatal, pois sua violência é rápida, coordenada e implacável.",
    aparencia: "As dracaenae são criaturas de corpo híbrido: possuem busto humano feminino e, no lugar das pernas, duas longas caudas serpentinas cobertas por escamas verdes e resistentes. Medem cerca de dois metros de altura quando eretas e se movem com fluidez predatória, usando as caudas tanto para impulsão quanto para mudanças bruscas de direção em combate. Seus rostos também são cobertos por escamas finas, com olhos de íris fendidas, idênticas às de víboras.\n\nSão guerreiras treinadas, frequentemente vistas empunhando lanças e escudos, e por vezes utilizando armaduras adaptadas ao seu corpo. Suas bocas escondem presas longas e pontiagudas, capazes de penetrar profundamente a carne dos inimigos e injetar toxinas letais. Ao falar, puxam involuntariamente o “s”, produzindo um sibilo constante que reforça sua natureza serpentina.",
    atributos_principais: "",
    tipo: "terrestre",
    perigoso: false,
    cor_hex: "#eab308",
    imagem_url: "https://i.pinimg.com/736x/f8/f4/d8/f8f4d8f5f8a336c412fb3ea4c4cd734a.jpg"
  },
  {
    id: "espectro",
    nome: "Espectro",
    descricao: "Por terem fugido do submundo e tendo se mantido dessa maneira por anos, Hades e Tânatos costumam recompensar a captura de um espectro com passagem livre (uma única vez) para a corte do deus dos mortos.",
    indole: "Sendo necromantes que mantiveram seus dons mesmo após a morte, espectros são malignos e depravados em seus métodos. Preferem agir sozinhos, sendo extremamente raro encontrá-los em grupos, e estão constantemente buscando por meios de escapar de Tânatos (seja fugindo ou achando meios de se esconder dele).",
    aparencia: "Espectros possuem uma aparência que parece mesclar o espiritual com o físico. Seus corpos translúcidos parecem manter traços de vida, como adornos e joias, e quase todos vestem capas ou mantos negros para se ocultar da morte. Suas armas são feitas em metal negro e corrompidas a partir das almas de suas vítimas para obter o aspecto espectral.",
    atributos_principais: "",
    tipo: "ctonico",
    perigoso: true,
    cor_hex: "#ef4444",
    imagem_url: "https://i.pinimg.com/1200x/a6/1f/23/a61f2360815e1193b262d17ee9c4f33d.jpg"
  }
];

export const INITIAL_MONSTRO_PODERES: MonstroPoder[] = [
  {
    id: "dracaena_p1",
    monstro_id: "dracaena",
    numero: 1,
    nome: "Combate Marcial",
    tipo: "ativo",
    nivel_1_desc: "Dracaenae se movem com extrema agilidade, fazendo com que seus ataques venham de ângulos difíceis de prever e defender. Inimigos possuem 10% a menos de chance de bloqueio e esquiva, além de 15% a menos de chance de contra-ataque.",
    nivel_2_desc: "A redução na chance de esquiva e bloqueio passa a ser de 15%, enquanto a chance de contra-ataque é reduzida em 20%.",
    nivel_3_desc: "A redução na chance de esquiva e bloqueio passa a ser de 20%. Neste nível, os ataques da dracaena não podem ser contra-atacados.",
    nivel_4_desc: "A redução na chance de bloqueio e esquiva passa a ser de 25%. Caso a dracaena erre um ataque armado, ela pode realizar imediatamente um segundo ataque que causa metade do dano."
  },
  {
    id: "dracaena_p2",
    monstro_id: "dracaena",
    numero: 2,
    nome: "Perícia com Escudo",
    tipo: "passivo",
    nivel_1_desc: "Dracaenae recebem +15% de chance de bloqueio ao empunharem um escudo. Essa bonificação não se aplica a ataques em área ou ataques mentais e espirituais. A cada bloqueio bem-sucedido, essa chance extra é reduzida em 5%. Ao chegar a zero, o efeito entra em recarga por três turnos.",
    nivel_2_desc: "A chance de bloqueio extra aumenta para 30%. Caso a chance total ultrapasse 100%, o próximo bloqueio realizado é considerado crítico.",
    nivel_3_desc: "A dracaena pode bloquear um número indefinido de ataques utilizando seu escudo, ignorando o limite imposto por sua constituição. Cada bloqueio realizado além do limite, sendo ele bem-sucedido ou não, reduz a chance total de bloqueio em 10%.",
    nivel_4_desc: "O primeiro ataque recebido por uma dracaena empunhando um escudo é automaticamente bloqueado, caso seja possível. A partir disso, ela pode escolher bloquear automaticamente um ataque a cada três turnos. Em combates narrados, o narrador decide em qual ataque essa característica será utilizada."
  },
  {
    id: "dracaena_p3",
    monstro_id: "dracaena",
    numero: 3,
    nome: "Gladiadora",
    tipo: "ativo",
    nivel_1_desc: "Sempre que realiza um bloqueio com o escudo, a dracaena recebe +10% de aptidão no próximo ataque armado. Sempre que acerta um ataque armado, recebe +5% de chance de bloqueio na próxima defesa. Os efeitos não se acumulam.",
    nivel_2_desc: "A dracaena pode utilizar seu escudo ofensivamente, usando sua chance de bloqueio no lugar da aptidão para determinar o ataque. Cada ataque realizado dessa forma reduz em 10% a chance de bloqueio extra concedida por Perícia com Escudo.",
    nivel_3_desc: "Ataques bem-sucedidos realizados com o escudo causam atordoamento por dois turnos, fazendo com que o inimigo perca suas ações curtas.",
    nivel_4_desc: "Ataques armados contra alvos sob efeito de atordoamento são sempre considerados como um nível acima na rolagem. Um erro passa a ser um acerto comum, e um acerto acima da média passa a ser um acerto crítico."
  },
  {
    id: "dracaena_p4",
    monstro_id: "dracaena",
    numero: 4,
    nome: "Constrição",
    tipo: "passivo",
    nivel_1_desc: "A dracaena pode abrir mão de um ataque para tentar prender um inimigo ao custo de 60 de energia, enrolando uma de suas caudas serpentinas ao redor de um membro do alvo. A tentativa compara a força da dracaena com a força do inimigo. Um inimigo preso perde toda sua movimentação comum e quaisquer defesas que dependam do membro afetado. Qualquer dano recebido pela dracaena quebra a constrição. Quando quebrada, entra em tempo de recarga por três turnos. Caso o ataque constritor falhe, o tempo de recarga é de apenas dois turnos.",
    nivel_2_desc: "Ao custo de 80 de energia, a dracaena pode realizar uma constrição completa, prendendo o corpo inteiro do inimigo. O alvo perde toda a movimentação e defesas que dependam dela. Receber dano ainda quebra a constrição.",
    nivel_3_desc: "Enquanto mantém a constrição completa, a dracaena pode usar sua ação ofensiva e gastar 40 de energia para esmagar o inimigo, gerando um acúmulo da condição Sufocado. Este efeito possui 100% de chance de sucesso, mas pode ser interrompido por uma ação defensiva coerente. Cada acúmulo reduz em 40 a mana e o vigor do inimigo. Ao atingir seis acúmulos, o alvo desmaia. Caso a constrição seja quebrada, os acúmulos de Sufocado diminuem em 1 por turno.",
    nivel_4_desc: "A dracaena pode gastar 100 de energia para aplicar um aperto final, gerando imediatamente três acúmulos de Sufocado. Essa ação só pode ser realizada uma vez por combate e encerra a constrição ao final do uso."
  },
  {
    id: "dracaena_p5",
    monstro_id: "dracaena",
    numero: 5,
    nome: "Presa Venenosa",
    tipo: "ativo",
    nivel_1_desc: "Dracaenae possuem veneno natural em suas presas, podendo injetá-lo ao realizar um ataque de mordida, considerado um ataque desarmado, ao custo de 20 de energia. Neste nível, o ataque só pode ser usado contra inimigos sob efeito de Constrição (parcial ou completa). O veneno causa 10 de dano venenoso por turno durante três turnos, sendo cumulativo. Não possui tempo de recarga, mas usos em turnos subsequentes cusstam 10 de energia a mais, cumulativo por turno.",
    nivel_2_desc: "A dracaena pode utilizar a mordida venenosa mesmo sem o alvo estar sob Constrição, porém com uma penalidade de -10% na aptidão do ataque. O dano passa a ser de 15 por turno durante quatro turnos, ao custo de 30 de energia.",
    nivel_3_desc: "A penalidade para uso fora da Constrição é removida. O veneno passa a causar 20 de dano por turno durante cinco turnos, ao custo de 50 de energia.",
    nivel_4_desc: "Ao morder um inimigo sob Constrição, a dracaena pode aplicar todo o dano do nível 3 de uma só vez, totalizando 100 pontos de dano venenoso. Alternativamente, contra inimigos livres, o veneno passa a causar 50 de dano por turno durante dois turnos. Este efeito custa 50 de energia  (além do gasto pelo nível 3) e não interage com Estoque de Venenos."
  },
  {
    id: "dracaena_p6",
    monstro_id: "dracaena",
    numero: 6,
    nome: "Estoque de Venenos",
    tipo: "passivo",
    nivel_1_desc: "A Presa Venenosa pode aplicar um veneno alternativo que, em vez de causar dano, drena 20% da mana e do vigor do alvo. Pode ser utilizado uma vez por combate para cada nível de monstro que a dracaena possua. Aumenta o custo de energia do poder original em 20 pontos.",
    nivel_2_desc: "A Presa Venenosa pode aplicar um veneno que enfraquece a musculatura do inimigo, reduzindo em 10% o dano final de todos os ataques físicos. Pode ser utilizado uma vez por combate para cada nível de monstro que a dracaena possua. Aumenta o custo de energia do poder original em 30 pontos.",
    nivel_3_desc: "A Presa Venenosa pode aplicar um veneno que prejudica os sentidos do alvo, reduzindo em 15% a chance de acerto de todos os seus ataques. Pode ser utilizado uma vez por combate para cada nível de monstro que a dracaena possua. Aumenta o custo de energia do poder original em 40 pontos.",
    nivel_4_desc: "A Presa Venenosa pode aplicar um veneno que fecha os pulmões do inimigo, gerando um acúmulo da condição Sufocado por uso bem-sucedido. Acúmulos de Sufocado obtidos dessa forma não diminuem ao fim do turno. Pode ser utilizado uma vez por combate para cada nível de monstro que a dracaena possua. Aumenta o custo de energia do poder original em 50 pontos."
  },
  {
    id: "espectro_p1",
    monstro_id: "espectro",
    numero: 1,
    nome: "Espírito Insurgente",
    tipo: "ativo",
    nivel_1_desc: "Todo dano causado pelo espectro é convertido para espiritual, utilizando este atributo no lugar de força para os cálculos e rolagens de acerto. Além disso, o espectro recebe 20% de bônus em espiritualidade e 5% de chance de acerto espiritual.",
    nivel_2_desc: "O bônus em espiritualidade aumenta para 40%, e a chance de acerto espiritual para 10%.",
    nivel_3_desc: "O bônus em espiritualidade aumenta para 60%, e a chance de acerto espiritual para 15%.",
    nivel_4_desc: "O bônus em espiritualidade aumenta para 80%, e a chance de acerto espiritual para 20% (ultrapassando o teto do fórum)."
  },
  {
    id: "espectro_p2",
    monstro_id: "espectro",
    numero: 2,
    nome: "Imortalidade Desesperada",
    tipo: "passivo",
    nivel_1_desc: "Espectros são resistentes a dano não por sua constituição, mas pelo desespero de se atrelar a uma forma quase doentia de vida. Neste nível, todo dano não espiritual que recebam é reduzido em 5% (que se soma à resistência normal do espectro). Caso receba dano espiritual, essa passiva deixa de funcionar em todos os seus níveis até o fim do turno.",
    nivel_2_desc: "Neste nível, a redução aumenta para 10%.",
    nivel_3_desc: "Neste nível, a redução aumenta para 15%",
    nivel_4_desc: "No nível final, a redução aumenta para 20% e, uma vez por combate, o espectro ignora completamente o aumento de dano gerado por um acerto crítico que tenha sofrido."
  },
  {
    id: "espectro_p3",
    monstro_id: "espectro",
    numero: 3,
    nome: "Domínio Profano",
    tipo: "ativo",
    nivel_1_desc: "Espectros clamam o domínio sobre os mortos, mas não oferecem a eles qualquer lealdade. Quando uma criatura invocada pelo espectro morre, este recupera 20 de energia.",
    nivel_2_desc: "A partir deste nível, qualquer criatura invocada pelo espectro utiliza a chance de acerto por espiritualidade dele para atacar, caso seja maior que suas próprias aptidões.",
    nivel_3_desc: "Um dos mortos-vivos invocado pelo espectro passa a surgir com 200 HP, no lugar de 100. Essa passiva só entra em efeito uma vez por combate.",
    nivel_4_desc: "Mortos-vivos invocados pelo espectro passam a ter seu dano convertido para espiritual, assim como o próprio invocador."
  },
  {
    id: "espectro_p4",
    monstro_id: "espectro",
    numero: 4,
    nome: "Reivindicar os Mortos",
    tipo: "passivo",
    nivel_1_desc: "Um espectro é capaz de convocar os mortos e reivindicar o domínio para si, um ato de necromancia que ofende os deuses da morte. Invocações de qualquer nível deste poder possuem enjoo, mas não pagam energia por ataque. Neste nível, por 40 de energia, é capaz de trazer um zumbi que possui a mesma ficha do bestiário, e nível 1 de monstro. Todos os seus atributos físicos possuem 1 ponto e ele possui 100 de HP - qualquer poder ativo usado consome a energia do próprio espectro. Caso use o poder em níveis mais altos, pode invocar um zumbi extra por nível, pagando 40 de energia por cada.",
    nivel_2_desc: "Neste nível e pagando 60 de energia, é capaz de trazer um ghoul que possui a mesma ficha do bestiário, e nível 1 de monstro. Todos os seus atributos físicos possuem 2 pontos, e ele possui 100 de HP. Qualquer poder ativo utilizado consome a energia do próprio espectro. Caso use o poder em níveis mais altos, consegue invocar um ghoul extra por nível, pagando 60 de energia por cada.",
    nivel_3_desc: "Neste nível e pagando 80 de energia, é capaz de trazer um spartus que possui a mesma ficha do bestiário, e nível 1 de monstro. Todos os seus atributos físicos possuem 3 pontos, e ele possui 100 de HP. Qualquer poder ativo utilizado consome a energia do próprio espectro. Caso use o poder em níveis mais altos, consegue invocar um spartus extra por nível, pagando 80 de energia por cada.",
    nivel_4_desc: "No nível final, um espectro clama domínio completo sobre a morte. Ao invocar uma criatura, é possível pagar mais 20 de energia (por invocação) para que ela surja no nível 2. Cada criatura invocada dessa maneira também surge com 50 de energia para usar suas próprias habilidades. Usar o poder dessa maneira ainda conta como um uso de nível mais alto (seria possível, por exemplo, invocar quatro zumbis de nível 2 ao custo de 240 de energia)."
  },
  {
    id: "espectro_p5",
    monstro_id: "espectro",
    numero: 5,
    nome: "Âncora da Existência",
    tipo: "ativo",
    nivel_1_desc: "O espectro força sua alma a se prender temporariamente a ecos de morte ao seu redor - mortos-vivos ou criaturas espirituais aliadas. Pagando 40 de energia, ele ancora sua essência a uma criatura deste tipo, redirecionando 30% de todo o dano que receber (após cálculo das resistências) para ela. Além disso, o alvo ancorado perde 10% de dano. O efeito dura por dois turnos e entra em tempo de espera por mais dois. Quando um alvo ancorado morre, o espectro pode pagar imediatamente o custo do poder para ancorar um novo pelo restante da duração do poder.",
    nivel_2_desc: "No nível 2, o custo de energia passa a ser 60, e agora 40% de todo o dano recebido pelo espectro é direcionado ao alvo. A criatura afetada não tem mais debuff em dano, e o poder passa a durar por três turnos antes de entrar em espera.",
    nivel_3_desc: "No nível 3, o custo de energia passa a ser 80, e agora 50% de todo o dano recebido pelo espectro é direcionado ao alvo. Todo dano espiritual causado por um espectro que ancorou sua essência é aumentado em 10%, e a duração do poder aumenta para quatro turnos.",
    nivel_4_desc: "O nível 4 funciona como os anteriores, mas agora custa 100 de energia para aumentar a duração para cinco turnos. Adicionalmente, caso o espectro sofra dano letal enquanto tem sua essência ancorada, o alvo da âncora morre em seu lugar e o dano causado ao espectro é anulado."
  },
  {
    id: "espectro_p6",
    monstro_id: "espectro",
    numero: 6,
    nome: "Drenar Essência",
    tipo: "passivo",
    nivel_1_desc: "Espectros são seres repletos de energia negativa, capazes de sugar tudo o que é bom e converter em pura maldade. Através do toque, podem lançar uma onda de energia necrótica em seus inimigos. Por 40 de energia, causa 40 de dano espiritual em um alvo e cura o espectro em 50% do dano causado. Três turnos de tempo de recarga.",
    nivel_2_desc: "Tanto o custo quando o dano causado aumentam para 60, com o espectro ainda se curando em 50% deste. Alternativamente, pode pagar o custo para curar qualquer morto-vivo que não esteja sob o efeito de Âncora da Existência em 60 de HP.",
    nivel_3_desc: "Neste nível, tanto o custo quanto o dano causado aumentam para 80, mas a cura agora é de 60% do dano causado. O uso alternativo passa a curar 90 de HP do morto-vivo afetado.",
    nivel_4_desc: "No nível final, o poder custa 100 de energia e causa 100 de dano espiritual, ainda curando o espectro em 60% do valor causado. O uso alternativo passa a curar mortos-vivos em área, devolvendo 90 HP a todos que estiverem a até 5 metros do espectro."
  }
];

