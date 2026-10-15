export const worlds=[
 {id:'jin',theme:'forest',game:'森林之子',en:'SONS OF THE FOREST',label:'晋味营地',cuisine:'晋菜',title:'把家乡，<br>做成今晚的补给。',copy:'一碗面，一点醋。熟悉的味道，陪你过一个好生日。',feature:'jin-001',accent:'#d98c4b'},
 {id:'chuan',theme:'csgo',game:'CS:GO',en:'COUNTER-STRIKE: GLOBAL OFFENSIVE',label:'川味行动',cuisine:'川菜',title:'这一局，<br>川味上桌。',copy:'麻、辣、鲜、香。选好这一餐的味道，准备开火。',feature:'chuan-002',accent:'#e2bf73'},
 {id:'xiang',theme:'delta',game:'三角洲',en:'DELTA FORCE',label:'湘味装备',cuisine:'湘菜',title:'配齐这一餐，<br>再开火。',copy:'备好青椒和肉，把锅烧热。今天的任务：好好吃饭。',feature:'xiang-001',accent:'#91d4b0'},
 {id:'lu',theme:'pubg',game:'绝地求生',en:'PUBG: BATTLEGROUNDS',label:'鲁味空投',cuisine:'鲁菜',title:'补给到齐。<br>今晚吃好。',copy:'从家常小炒到慢工大菜，把扎实的好味道装进这一餐。',feature:'lu-006',accent:'#f0c548'},
 {id:'yue',theme:'apex',game:'Apex',en:'APEX LEGENDS',label:'粤味集结',cuisine:'粤菜',title:'鲜味集结，<br>一起上桌。',copy:'留住食材本味，把平常的一餐做得值得庆祝。',feature:'yue-012',accent:'#efb778'},
 {id:'jiangzhe',theme:'elden',game:'艾尔登法环',en:'ELDEN RING',label:'江南赐福',cuisine:'江浙菜',title:'温一盏灯，<br>慢炖一餐。',copy:'清鲜与浓醇之间，总有一道值得慢慢等的好菜。',feature:'jiangzhe-002',accent:'#d4bd7c'},
 {id:'western-dessert',theme:'palworld',game:'幻兽帕鲁',en:'PALWORLD',label:'帕鲁食堂',cuisine:'西餐与甜点',title:'主食吃饱，<br>甜点留一口。',copy:'简单的西餐，认真做的小甜点。愿你每一岁，都吃得开心。',feature:'western-dessert-001',accent:'#238f98'},
];
export const worldFor=id=>worlds.find(w=>w.id===id)||worlds[0];
