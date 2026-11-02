import type {
  Departure,
  Stop,
  TransitClient,
  TransportLine,
  TransportMode,
  TripLeg,
  TripOption,
  TripTimeOptions,
} from '../types';

// Heavy rail stations sourced from Wikipedia's current (post Oct-2024 restructure)
// Sydney Trains line articles. Lat/lon are approximate (good enough for
// straight-line "nearest station" sorting) — for survey-grade coordinates or
// to verify exact stopping patterns, use the real TfNSW GTFS static feed.
const STOPS: Stop[] = [
  { id: 'central', name: 'Central Station', modes: ['train', 'lightrail', 'metro'], lat: -33.8832, lon: 151.2061 },
  { id: 'townhall', name: 'Town Hall Station', modes: ['train'], lat: -33.8732, lon: 151.2069 },
  { id: 'wynyard', name: 'Wynyard Station', modes: ['train'], lat: -33.8655, lon: 151.2057 },
  { id: 'circularquay', name: 'Circular Quay', modes: ['train', 'ferry'], lat: -33.8614, lon: 151.2099 },
  { id: 'northsydney', name: 'North Sydney Station', modes: ['train'], lat: -33.8398, lon: 151.2075 },
  { id: 'bondijunction', name: 'Bondi Junction Station', modes: ['train', 'bus'], lat: -33.8915, lon: 151.2477 },
  { id: 'qvb', name: 'QVB, George St', modes: ['bus', 'lightrail'], lat: -33.8721, lon: 151.2066 },
  { id: 'chatswood', name: 'Chatswood Station', modes: ['train', 'bus', 'metro'], lat: -33.7971, lon: 151.1828 },
  { id: 'mascot', name: 'Mascot Station', modes: ['train'], lat: -33.9239, lon: 151.1935 },
  { id: 'domesticairport', name: 'Domestic Airport Station', modes: ['train'], lat: -33.9385, lon: 151.1731 },
  { id: 'internationalairport', name: 'International Airport Station', modes: ['train'], lat: -33.9461, lon: 151.1772 },
  { id: 'wollicreek', name: 'Wolli Creek Station', modes: ['train'], lat: -33.9298, lon: 151.1472 },

  // T1 North Shore
  { id: 'berowra', name: 'Berowra', modes: ['train'], lat: -33.6273, lon: 151.1402 },
  { id: 'mountkuringgai', name: 'Mount Kuring-gai', modes: ['train'], lat: -33.6469, lon: 151.1322 },
  { id: 'mountcolah', name: 'Mount Colah', modes: ['train'], lat: -33.6696, lon: 151.1284 },
  { id: 'asquith', name: 'Asquith', modes: ['train'], lat: -33.6855, lon: 151.1083 },
  { id: 'hornsby', name: 'Hornsby', modes: ['train'], lat: -33.7036, lon: 151.0986 },
  { id: 'waitara', name: 'Waitara', modes: ['train'], lat: -33.7138, lon: 151.1003 },
  { id: 'wahroonga', name: 'Wahroonga', modes: ['train'], lat: -33.7271, lon: 151.1171 },
  { id: 'warrawee', name: 'Warrawee', modes: ['train'], lat: -33.7338, lon: 151.1198 },
  { id: 'turramurra', name: 'Turramurra', modes: ['train'], lat: -33.7423, lon: 151.1264 },
  { id: 'pymble', name: 'Pymble', modes: ['train'], lat: -33.7508, lon: 151.1279 },
  { id: 'gordon', name: 'Gordon', modes: ['train'], lat: -33.7572, lon: 151.1548 },
  { id: 'killara', name: 'Killara', modes: ['train'], lat: -33.7678, lon: 151.1583 },
  { id: 'lindfield', name: 'Lindfield', modes: ['train'], lat: -33.7778, lon: 151.1667 },
  { id: 'roseville', name: 'Roseville', modes: ['train'], lat: -33.7789, lon: 151.1797 },
  { id: 'artarmon', name: 'Artarmon', modes: ['train'], lat: -33.8072, lon: 151.1864 },
  { id: 'stleonards', name: 'St Leonards', modes: ['train'], lat: -33.8229, lon: 151.1962 },
  { id: 'wollstonecraft', name: 'Wollstonecraft', modes: ['train'], lat: -33.8324, lon: 151.1998 },
  { id: 'waverton', name: 'Waverton', modes: ['train'], lat: -33.8388, lon: 151.2021 },
  { id: 'milsonspoint', name: 'Milsons Point', modes: ['train'], lat: -33.8464, lon: 151.2113 },
  { id: 'strathfield', name: 'Strathfield', modes: ['train'], lat: -33.8703, lon: 151.0943 },
  { id: 'parramatta', name: 'Parramatta', modes: ['train', 'bus'], lat: -33.8150, lon: 151.0024 },
  { id: 'harrispark', name: 'Harris Park', modes: ['train'], lat: -33.8200, lon: 151.0107 },
  { id: 'westmead', name: 'Westmead', modes: ['train'], lat: -33.8035, lon: 150.9881 },
  { id: 'wentworthville', name: 'Wentworthville', modes: ['train'], lat: -33.8047, lon: 150.9733 },
  { id: 'pendlehill', name: 'Pendle Hill', modes: ['train'], lat: -33.7994, lon: 150.9586 },
  { id: 'toongabbie', name: 'Toongabbie', modes: ['train'], lat: -33.7903, lon: 150.9480 },
  { id: 'sevenhills', name: 'Seven Hills', modes: ['train'], lat: -33.7773, lon: 150.9355 },
  { id: 'blacktown', name: 'Blacktown', modes: ['train'], lat: -33.7679, lon: 150.9064 },
  { id: 'doonside', name: 'Doonside', modes: ['train'], lat: -33.7667, lon: 150.8836 },
  { id: 'rootyhill', name: 'Rooty Hill', modes: ['train'], lat: -33.7671, lon: 150.8600 },
  { id: 'mountdruitt', name: 'Mount Druitt', modes: ['train'], lat: -33.7673, lon: 150.8323 },
  { id: 'stmarys', name: 'St Marys', modes: ['train'], lat: -33.7667, lon: 150.7757 },
  { id: 'werrington', name: 'Werrington', modes: ['train'], lat: -33.7569, lon: 150.7391 },
  { id: 'kingswood', name: 'Kingswood', modes: ['train'], lat: -33.7569, lon: 150.7227 },
  { id: 'penrith', name: 'Penrith', modes: ['train'], lat: -33.7506, lon: 150.6943 },
  { id: 'emuplains', name: 'Emu Plains', modes: ['train'], lat: -33.7483, lon: 150.6697 },
  { id: 'marayong', name: 'Marayong', modes: ['train'], lat: -33.7461, lon: 150.9002 },
  { id: 'quakershill', name: 'Quakers Hill', modes: ['train'], lat: -33.7281, lon: 150.8868 },
  { id: 'schofields', name: 'Schofields', modes: ['train'], lat: -33.7047, lon: 150.8739 },
  { id: 'riverstone', name: 'Riverstone', modes: ['train'], lat: -33.6791, lon: 150.8603 },
  { id: 'vineyard', name: 'Vineyard', modes: ['train'], lat: -33.6510, lon: 150.8511 },
  { id: 'mulgrave', name: 'Mulgrave', modes: ['train'], lat: -33.6267, lon: 150.8302 },
  { id: 'windsor', name: 'Windsor', modes: ['train'], lat: -33.6138, lon: 150.8108 },
  { id: 'clarendon', name: 'Clarendon', modes: ['train'], lat: -33.6090, lon: 150.7882 },
  { id: 'eastrichmond', name: 'East Richmond', modes: ['train'], lat: -33.6019, lon: 150.7598 },
  { id: 'richmond', name: 'Richmond', modes: ['train'], lat: -33.5991, lon: 150.7532 },

  // T2 / T3 inner west + South West
  { id: 'redfern', name: 'Redfern', modes: ['train'], lat: -33.8921, lon: 151.1997 },
  { id: 'macdonaldtown', name: 'Macdonaldtown', modes: ['train'], lat: -33.8956, lon: 151.1838 },
  { id: 'newtown', name: 'Newtown', modes: ['train'], lat: -33.8977, lon: 151.1794 },
  { id: 'stanmore', name: 'Stanmore', modes: ['train'], lat: -33.8972, lon: 151.1667 },
  { id: 'petersham', name: 'Petersham', modes: ['train'], lat: -33.8958, lon: 151.1536 },
  { id: 'lewisham', name: 'Lewisham', modes: ['train'], lat: -33.8937, lon: 151.1463 },
  { id: 'summerhill', name: 'Summer Hill', modes: ['train'], lat: -33.8922, lon: 151.1357 },
  { id: 'ashfield', name: 'Ashfield', modes: ['train'], lat: -33.8894, lon: 151.1245 },
  { id: 'croydon', name: 'Croydon', modes: ['train'], lat: -33.8822, lon: 151.1137 },
  { id: 'burwood', name: 'Burwood', modes: ['train'], lat: -33.8775, lon: 151.1038 },
  { id: 'homebush', name: 'Homebush', modes: ['train'], lat: -33.8656, lon: 151.0836 },
  { id: 'flemington', name: 'Flemington', modes: ['train'], lat: -33.8600, lon: 151.0767 },
  { id: 'lidcombe', name: 'Lidcombe', modes: ['train'], lat: -33.8550, lon: 151.0433 },
  { id: 'auburn', name: 'Auburn', modes: ['train'], lat: -33.8495, lon: 151.0330 },
  { id: 'clyde', name: 'Clyde', modes: ['train'], lat: -33.8408, lon: 151.0163 },
  { id: 'granville', name: 'Granville', modes: ['train'], lat: -33.8347, lon: 151.0097 },
  { id: 'merrylands', name: 'Merrylands', modes: ['train'], lat: -33.8339, lon: 150.9833 },
  { id: 'guildford', name: 'Guildford', modes: ['train'], lat: -33.8578, lon: 150.9794 },
  { id: 'chesterhill', name: 'Chester Hill', modes: ['train'], lat: -33.8900, lon: 150.9833 },
  { id: 'yennora', name: 'Yennora', modes: ['train'], lat: -33.8744, lon: 150.9711 },
  { id: 'fairfield', name: 'Fairfield', modes: ['train'], lat: -33.8706, lon: 150.9558 },
  { id: 'villawood', name: 'Villawood', modes: ['train'], lat: -33.8828, lon: 150.9961 },
  { id: 'canleyvale', name: 'Canley Vale', modes: ['train'], lat: -33.8822, lon: 150.9478 },
  { id: 'carramar', name: 'Carramar', modes: ['train'], lat: -33.8789, lon: 150.9558 },
  { id: 'cabramatta', name: 'Cabramatta', modes: ['train'], lat: -33.8942, lon: 150.9358 },
  { id: 'warwickfarm', name: 'Warwick Farm', modes: ['train'], lat: -33.9094, lon: 150.9458 },
  { id: 'liverpool', name: 'Liverpool', modes: ['train', 'bus'], lat: -33.9203, lon: 150.9236 },
  { id: 'casula', name: 'Casula', modes: ['train'], lat: -33.9394, lon: 150.9075 },
  { id: 'glenfield', name: 'Glenfield', modes: ['train'], lat: -33.9711, lon: 150.8858 },
  { id: 'edmondsonpark', name: 'Edmondson Park', modes: ['train'], lat: -33.9814, lon: 150.8572 },
  { id: 'leppington', name: 'Leppington', modes: ['train'], lat: -33.9769, lon: 150.8181 },
  { id: 'berala', name: 'Berala', modes: ['train'], lat: -33.8686, lon: 151.0381 },
  { id: 'regentspark', name: 'Regents Park', modes: ['train'], lat: -33.8878, lon: 151.0231 },
  { id: 'birrong', name: 'Birrong', modes: ['train'], lat: -33.8847, lon: 151.0092 },
  { id: 'yagoona', name: 'Yagoona', modes: ['train'], lat: -33.9014, lon: 151.0219 },
  { id: 'bankstown', name: 'Bankstown', modes: ['train'], lat: -33.9172, lon: 151.0347 },
  { id: 'sydneyolympicpark', name: 'Sydney Olympic Park', modes: ['train'], lat: -33.8467, lon: 151.0708 },

  // T4 Eastern Suburbs & Illawarra
  { id: 'edgecliff', name: 'Edgecliff', modes: ['train'], lat: -33.8778, lon: 151.2336 },
  { id: 'kingscross', name: 'Kings Cross', modes: ['train'], lat: -33.8749, lon: 151.2222 },
  { id: 'martinplace', name: 'Martin Place', modes: ['train'], lat: -33.8683, lon: 151.2117 },
  { id: 'erskineville', name: 'Erskineville', modes: ['train'], lat: -33.8988, lon: 151.1856 },
  { id: 'stpeters', name: 'St Peters', modes: ['train'], lat: -33.9093, lon: 151.1792 },
  { id: 'sydenham', name: 'Sydenham', modes: ['train'], lat: -33.9172, lon: 151.1611 },
  { id: 'tempe', name: 'Tempe', modes: ['train'], lat: -33.9203, lon: 151.1517 },
  { id: 'arncliffe', name: 'Arncliffe', modes: ['train'], lat: -33.9372, lon: 151.1500 },
  { id: 'banksia', name: 'Banksia', modes: ['train'], lat: -33.9558, lon: 151.1372 },
  { id: 'rockdale', name: 'Rockdale', modes: ['train'], lat: -33.9533, lon: 151.1392 },
  { id: 'kogarah', name: 'Kogarah', modes: ['train'], lat: -33.9664, lon: 151.1328 },
  { id: 'carlton', name: 'Carlton', modes: ['train'], lat: -33.9706, lon: 151.1211 },
  { id: 'allawah', name: 'Allawah', modes: ['train'], lat: -33.9744, lon: 151.1158 },
  { id: 'hurstville', name: 'Hurstville', modes: ['train', 'bus'], lat: -33.9669, lon: 151.1022 },
  { id: 'penshurst', name: 'Penshurst', modes: ['train'], lat: -33.9636, lon: 151.0928 },
  { id: 'mortdale', name: 'Mortdale', modes: ['train'], lat: -33.9636, lon: 151.0817 },
  { id: 'oatley', name: 'Oatley', modes: ['train'], lat: -33.9728, lon: 151.0756 },
  { id: 'como', name: 'Como', modes: ['train'], lat: -34.0003, lon: 151.0661 },
  { id: 'jannali', name: 'Jannali', modes: ['train'], lat: -34.0067, lon: 151.0631 },
  { id: 'sutherland', name: 'Sutherland', modes: ['train', 'bus'], lat: -34.0314, lon: 151.0578 },
  { id: 'kirrawee', name: 'Kirrawee', modes: ['train'], lat: -34.0319, lon: 151.0539 },
  { id: 'gymea', name: 'Gymea', modes: ['train'], lat: -34.0356, lon: 151.0869 },
  { id: 'miranda', name: 'Miranda', modes: ['train'], lat: -34.0356, lon: 151.1017 },
  { id: 'caringbah', name: 'Caringbah', modes: ['train'], lat: -34.0458, lon: 151.1161 },
  { id: 'woolooware', name: 'Woolooware', modes: ['train'], lat: -34.0481, lon: 151.1253 },
  { id: 'cronulla', name: 'Cronulla', modes: ['train'], lat: -34.0569, lon: 151.1536 },
  { id: 'loftus', name: 'Loftus', modes: ['train'], lat: -34.0444, lon: 151.0531 },
  { id: 'engadine', name: 'Engadine', modes: ['train'], lat: -34.0683, lon: 151.0094 },
  { id: 'heathcote', name: 'Heathcote', modes: ['train'], lat: -34.0825, lon: 150.9986 },
  { id: 'waterfall', name: 'Waterfall', modes: ['train'], lat: -34.1286, lon: 150.9994 },

  // T8 Airport & South
  { id: 'greensquare', name: 'Green Square', modes: ['train'], lat: -33.8997, lon: 151.2039 },
  { id: 'turrella', name: 'Turrella', modes: ['train'], lat: -33.9258, lon: 151.1431 },
  { id: 'bardwellpark', name: 'Bardwell Park', modes: ['train'], lat: -33.9400, lon: 151.1358 },
  { id: 'bexleynorth', name: 'Bexley North', modes: ['train'], lat: -33.9478, lon: 151.1119 },
  { id: 'kingsgrove', name: 'Kingsgrove', modes: ['train'], lat: -33.9436, lon: 151.0872 },
  { id: 'beverlyhills', name: 'Beverly Hills', modes: ['train'], lat: -33.9550, lon: 151.0803 },
  { id: 'narwee', name: 'Narwee', modes: ['train'], lat: -33.9622, lon: 151.0714 },
  { id: 'riverwood', name: 'Riverwood', modes: ['train'], lat: -33.9636, lon: 151.0586 },
  { id: 'padstow', name: 'Padstow', modes: ['train'], lat: -33.9558, lon: 151.0369 },
  { id: 'revesby', name: 'Revesby', modes: ['train'], lat: -33.9481, lon: 151.0197 },
  { id: 'panania', name: 'Panania', modes: ['train'], lat: -33.9583, lon: 151.0019 },
  { id: 'easthills', name: 'East Hills', modes: ['train'], lat: -33.9636, lon: 150.9881 },
  { id: 'holsworthy', name: 'Holsworthy', modes: ['train'], lat: -33.9728, lon: 150.9711 },
  { id: 'macquariefields', name: 'Macquarie Fields', modes: ['train'], lat: -33.9961, lon: 150.8858 },
  { id: 'ingleburn', name: 'Ingleburn', modes: ['train'], lat: -34.0033, lon: 150.8664 },
  { id: 'minto', name: 'Minto', modes: ['train'], lat: -34.0292, lon: 150.8408 },
  { id: 'leumeah', name: 'Leumeah', modes: ['train'], lat: -34.0486, lon: 150.8300 },
  { id: 'campbelltown', name: 'Campbelltown', modes: ['train', 'bus'], lat: -34.0661, lon: 150.8144 },
  { id: 'macarthur', name: 'Macarthur', modes: ['train'], lat: -34.0686, lon: 150.8097 },

  // T9 Northern
  { id: 'normanhurst', name: 'Normanhurst', modes: ['train'], lat: -33.7206, lon: 151.0881 },
  { id: 'thornleigh', name: 'Thornleigh', modes: ['train'], lat: -33.7322, lon: 151.0781 },
  { id: 'pennanthills', name: 'Pennant Hills', modes: ['train'], lat: -33.7392, lon: 151.0683 },
  { id: 'beecroft', name: 'Beecroft', modes: ['train'], lat: -33.7486, lon: 151.0603 },
  { id: 'cheltenham', name: 'Cheltenham', modes: ['train'], lat: -33.7569, lon: 151.0744 },
  { id: 'epping', name: 'Epping', modes: ['train', 'bus'], lat: -33.7725, lon: 151.0817 },
  { id: 'eastwood', name: 'Eastwood', modes: ['train'], lat: -33.7889, lon: 151.0828 },
  { id: 'denistone', name: 'Denistone', modes: ['train'], lat: -33.7978, lon: 151.0917 },
  { id: 'westryde', name: 'West Ryde', modes: ['train'], lat: -33.8064, lon: 151.0931 },
  { id: 'meadowbank', name: 'Meadowbank', modes: ['train'], lat: -33.8178, lon: 151.0867 },
  { id: 'rhodes', name: 'Rhodes', modes: ['train'], lat: -33.8275, lon: 151.0858 },
  { id: 'concordwest', name: 'Concord West', modes: ['train'], lat: -33.8378, lon: 151.0919 },
  { id: 'northstrathfield', name: 'North Strathfield', modes: ['train'], lat: -33.8536, lon: 151.0961 },
];

const POPULAR_STOP_IDS = ['central', 'townhall', 'circularquay', 'wynyard'];

interface LineDef {
  id: string;
  mode: TransportMode;
  name: string;
  destinations: string[];
  stopIds: string[];
}

const LINE_DEFS: LineDef[] = [
  {
    id: 't1',
    mode: 'train',
    name: 'T1 North Shore & Western Line',
    destinations: ['Berowra', 'Emu Plains', 'Richmond', 'Central'],
    stopIds: [
      'berowra', 'mountkuringgai', 'mountcolah', 'asquith', 'hornsby', 'waitara', 'wahroonga', 'warrawee',
      'turramurra', 'pymble', 'gordon', 'killara', 'lindfield', 'roseville', 'chatswood', 'artarmon',
      'stleonards', 'wollstonecraft', 'waverton', 'northsydney', 'milsonspoint', 'wynyard', 'circularquay',
      'townhall', 'central', 'strathfield', 'parramatta', 'harrispark', 'westmead', 'wentworthville',
      'pendlehill', 'toongabbie', 'sevenhills', 'blacktown', 'doonside', 'rootyhill', 'mountdruitt',
      'stmarys', 'werrington', 'kingswood', 'penrith', 'emuplains', 'marayong', 'quakershill', 'schofields',
      'riverstone', 'vineyard', 'mulgrave', 'windsor', 'clarendon', 'eastrichmond', 'richmond',
    ],
  },
  {
    id: 't2',
    mode: 'train',
    name: 'T2 Leppington & Inner West Line',
    destinations: ['Leppington', 'Parramatta', 'City'],
    stopIds: [
      'central', 'redfern', 'macdonaldtown', 'newtown', 'stanmore', 'petersham', 'lewisham', 'summerhill',
      'ashfield', 'croydon', 'burwood', 'strathfield', 'homebush', 'flemington', 'lidcombe', 'auburn',
      'clyde', 'granville', 'parramatta', 'merrylands', 'guildford', 'chesterhill', 'yennora', 'fairfield',
      'villawood', 'canleyvale', 'carramar', 'cabramatta', 'warwickfarm', 'liverpool', 'casula', 'glenfield',
      'edmondsonpark', 'leppington',
    ],
  },
  {
    id: 't3',
    mode: 'train',
    name: 'T3 Liverpool & Inner West Line',
    destinations: ['Liverpool', 'City'],
    stopIds: [
      'central', 'redfern', 'macdonaldtown', 'newtown', 'stanmore', 'petersham', 'lewisham', 'summerhill',
      'ashfield', 'croydon', 'burwood', 'strathfield', 'homebush', 'flemington', 'lidcombe', 'berala',
      'regentspark', 'birrong', 'villawood', 'carramar', 'canleyvale', 'cabramatta', 'warwickfarm', 'liverpool',
    ],
  },
  {
    id: 't4',
    mode: 'train',
    name: 'T4 Eastern Suburbs & Illawarra Line',
    destinations: ['Cronulla', 'Waterfall', 'Bondi Junction', 'Central'],
    stopIds: [
      'bondijunction', 'edgecliff', 'kingscross', 'martinplace', 'townhall', 'central', 'erskineville',
      'stpeters', 'sydenham', 'tempe', 'wollicreek', 'arncliffe', 'banksia', 'rockdale', 'kogarah', 'carlton',
      'allawah', 'hurstville', 'penshurst', 'mortdale', 'oatley', 'como', 'jannali', 'sutherland', 'kirrawee',
      'gymea', 'miranda', 'caringbah', 'woolooware', 'cronulla', 'loftus', 'engadine', 'heathcote', 'waterfall',
    ],
  },
  {
    id: 't5',
    mode: 'train',
    name: 'T5 Cumberland Line',
    destinations: ['Richmond', 'Leppington'],
    stopIds: [
      'leppington', 'edmondsonpark', 'glenfield', 'casula', 'liverpool', 'warwickfarm', 'cabramatta',
      'canleyvale', 'fairfield', 'yennora', 'guildford', 'merrylands', 'harrispark', 'parramatta', 'westmead',
      'wentworthville', 'pendlehill', 'toongabbie', 'sevenhills', 'blacktown', 'marayong', 'quakershill',
      'schofields', 'riverstone', 'vineyard', 'mulgrave', 'windsor', 'clarendon', 'eastrichmond', 'richmond',
    ],
  },
  {
    id: 't6',
    mode: 'train',
    name: 'T6 Lidcombe & Bankstown Line',
    destinations: ['Bankstown', 'Lidcombe'],
    stopIds: ['lidcombe', 'berala', 'regentspark', 'birrong', 'yagoona', 'bankstown'],
  },
  {
    id: 't7',
    mode: 'train',
    name: 'T7 Olympic Park Line',
    destinations: ['Sydney Olympic Park', 'Lidcombe'],
    stopIds: ['lidcombe', 'sydneyolympicpark'],
  },
  {
    id: 't8',
    mode: 'train',
    name: 'T8 Airport & South Line',
    destinations: ['Macarthur', 'International Airport', 'City'],
    stopIds: [
      'central', 'greensquare', 'mascot', 'domesticairport', 'internationalairport', 'wollicreek', 'turrella',
      'bardwellpark', 'bexleynorth', 'kingsgrove', 'beverlyhills', 'narwee', 'riverwood', 'padstow', 'revesby',
      'panania', 'easthills', 'holsworthy', 'glenfield', 'macquariefields', 'ingleburn', 'minto', 'leumeah',
      'campbelltown', 'macarthur',
    ],
  },
  {
    id: 't9',
    mode: 'train',
    name: 'T9 Northern Line',
    destinations: ['Hornsby', 'Gordon', 'City'],
    stopIds: [
      'hornsby', 'normanhurst', 'thornleigh', 'pennanthills', 'beecroft', 'cheltenham', 'epping', 'eastwood',
      'denistone', 'westryde', 'meadowbank', 'rhodes', 'concordwest', 'northstrathfield', 'strathfield',
      'redfern', 'central', 'townhall', 'wynyard', 'milsonspoint', 'northsydney', 'waverton', 'wollstonecraft',
      'stleonards', 'artarmon', 'chatswood', 'roseville', 'lindfield', 'killara', 'gordon',
    ],
  },
  {
    id: 'm1',
    mode: 'metro',
    name: 'M1 Metro',
    destinations: ['Tallawong', 'Sydenham'],
    stopIds: ['chatswood', 'central'],
  },
  {
    id: 'l1',
    mode: 'lightrail',
    name: 'L1 Dulwich Hill Line',
    destinations: ['Dulwich Hill', 'Central Chalmers St'],
    stopIds: ['central', 'qvb'],
  },
  {
    id: 'f1',
    mode: 'ferry',
    name: 'F1 Manly',
    destinations: ['Manly', 'Circular Quay'],
    stopIds: ['circularquay'],
  },
  {
    id: 'b333',
    mode: 'bus',
    name: '333',
    destinations: ['Bondi Beach', 'Circular Quay'],
    stopIds: ['bondijunction', 'circularquay'],
  },
  {
    id: 'b389',
    mode: 'bus',
    name: '389',
    destinations: ['Bronte', 'Railway Square'],
    stopIds: ['qvb', 'chatswood'],
  },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function seededDepartures(stop: Stop): Departure[] {
  const now = Date.now();
  const departures: Departure[] = [];
  const linesAtStop = LINE_DEFS.filter((line) => line.stopIds.includes(stop.id));
  let offset = 2;
  let counter = 0;
  for (const line of linesAtStop) {
    for (let i = 0; i < 3; i++) {
      const destination = line.destinations[(i + offset) % line.destinations.length];
      const minutesUntil = offset;
      const scheduled = new Date(now + minutesUntil * 60_000).toISOString();
      const delayed = counter % 4 === 0;
      departures.push({
        id: `${stop.id}-${line.id}-${i}`,
        stopId: stop.id,
        mode: line.mode,
        line: line.name,
        destination,
        scheduledTime: scheduled,
        estimatedTime: delayed
          ? new Date(now + (minutesUntil + 2) * 60_000).toISOString()
          : scheduled,
        minutesUntil: delayed ? minutesUntil + 2 : minutesUntil,
        cancelled: counter % 11 === 0,
        platform: line.mode === 'train' ? String(1 + ((i + offset) % 4)) : undefined,
      });
      offset += 4 + (i % 3);
      counter++;
    }
  }
  return departures.sort((a, b) => a.minutesUntil - b.minutesUntil);
}

interface RouteLeg {
  line: LineDef;
  fromIdx: number;
  toIdx: number;
}

interface RouteCandidate {
  legs: RouteLeg[];
}

// How long it realistically takes to walk from one platform to another.
// Not real station geometry (we don't have that) - a deterministic
// approximation so adjacent platforms aren't all identical, loosely
// modelling that some platform pairs are closer together than others.
function platformWalkMinutes(platformA: string | undefined, platformB: string | undefined): number {
  const a = Number(platformA);
  const b = Number(platformB);
  if (!platformA || !platformB || Number.isNaN(a) || Number.isNaN(b)) return 1;
  const diff = Math.abs(a - b);
  if (diff === 0) return 0;
  const jitter = ((a + b) % 3) * 0.33;
  return Math.round((diff * 0.5 + jitter) * 10) / 10;
}

// A transfer with 2+ minutes to spare is always makeable. Under that, it
// comes down to how far apart the platforms are.
function canMakeTransfer(gapMinutes: number, platformA?: string, platformB?: string): boolean {
  if (gapMinutes >= 2) return true;
  return platformWalkMinutes(platformA, platformB) <= gapMinutes;
}

// Finds multiple distinct routes - not just "the best" one - so a rider can
// see e.g. both "direct via T8" and "faster via T1 + a transfer" side by
// side, same as a real trip planner would offer. Walks the LINE_DEFS graph
// where each line's stopIds are already in physical order, so distance
// between two stops on the same line is just the index difference. Returns
// up to 3 candidates: the best direct line (if any) plus up to two distinct
// best transfer combinations (deduped by line pair), sorted fastest first
// once built into full TripOptions.
function findRoutes(fromId: string, toId: string): RouteCandidate[] {
  if (fromId === toId) return [];

  const directs: { candidate: RouteCandidate; stops: number }[] = [];
  for (const line of LINE_DEFS) {
    const fi = line.stopIds.indexOf(fromId);
    const ti = line.stopIds.indexOf(toId);
    if (fi === -1 || ti === -1 || fi === ti) continue;
    directs.push({ candidate: { legs: [{ line, fromIdx: fi, toIdx: ti }] }, stops: Math.abs(fi - ti) });
  }
  directs.sort((a, b) => a.stops - b.stops);

  const transfers: { candidate: RouteCandidate; stops: number }[] = [];
  for (const line1 of LINE_DEFS) {
    const fi = line1.stopIds.indexOf(fromId);
    if (fi === -1) continue;
    for (const transferId of line1.stopIds) {
      if (transferId === fromId) continue;
      const ti1 = line1.stopIds.indexOf(transferId);
      for (const line2 of LINE_DEFS) {
        if (line2.id === line1.id) continue;
        const ti2 = line2.stopIds.indexOf(transferId);
        if (ti2 === -1) continue;
        const toIdx2 = line2.stopIds.indexOf(toId);
        if (toIdx2 === -1 || toIdx2 === ti2) continue;
        const stops = Math.abs(fi - ti1) + Math.abs(ti2 - toIdx2);
        transfers.push({
          candidate: {
            legs: [
              { line: line1, fromIdx: fi, toIdx: ti1 },
              { line: line2, fromIdx: ti2, toIdx: toIdx2 },
            ],
          },
          stops,
        });
      }
    }
  }
  transfers.sort((a, b) => a.stops - b.stops);

  const seenLinePairs = new Set<string>();
  const dedupedTransfers = transfers.filter((t) => {
    const key = t.candidate.legs
      .map((l) => l.line.id)
      .sort()
      .join('+');
    if (seenLinePairs.has(key)) return false;
    seenLinePairs.add(key);
    return true;
  });

  const routes: RouteCandidate[] = [];
  if (directs[0]) routes.push(directs[0].candidate);
  for (const t of dedupedTransfers) {
    if (routes.length >= 3) break;
    routes.push(t.candidate);
  }
  return routes;
}

function platformForLeg(legDef: RouteLeg, legIdx: number): string | undefined {
  return legDef.line.mode === 'train' ? String(1 + ((legIdx + legDef.fromIdx) % 4)) : undefined;
}

// Where this leg lets you off - not necessarily the same platform it
// boarded from, which is exactly what matters for a transfer.
function arrivalPlatformForLeg(legDef: RouteLeg, legIdx: number): string | undefined {
  return legDef.line.mode === 'train' ? String(1 + ((legIdx + legDef.toIdx) % 4)) : undefined;
}

function buildTripOptions(routes: RouteCandidate[], baseTime: number, arriveBy: boolean): TripOption[] {
  const options: TripOption[] = routes.map((route, routeIndex) => {
    // Always built forward from a provisional start time; shifted into place
    // afterwards if the rider asked to arrive by `baseTime` instead.
    let cursor = baseTime + (6 + routeIndex * 3) * 60_000;
    const legs: TripLeg[] = [];

    route.legs.forEach((legDef, legIdx) => {
      const stopsCount = Math.max(1, Math.abs(legDef.toIdx - legDef.fromIdx));
      const travelMinutes = stopsCount * 2.5;
      const departScheduled = cursor;
      const delayed = (routeIndex + legIdx) % 3 === 0;
      const departEstimated = delayed ? departScheduled + 3 * 60_000 : departScheduled;
      const arriveScheduled = departScheduled + travelMinutes * 60_000;
      const arriveEstimated = departEstimated + travelMinutes * 60_000;
      const fromStop = STOPS.find((s) => s.id === legDef.line.stopIds[legDef.fromIdx])!;
      const toStop = STOPS.find((s) => s.id === legDef.line.stopIds[legDef.toIdx])!;
      const platform = platformForLeg(legDef, legIdx);
      const arrivalPlatform = arrivalPlatformForLeg(legDef, legIdx);

      legs.push({
        mode: legDef.line.mode,
        line: legDef.line.name,
        fromStop,
        toStop,
        departScheduled: new Date(departScheduled).toISOString(),
        departEstimated: new Date(departEstimated).toISOString(),
        arriveScheduled: new Date(arriveScheduled).toISOString(),
        arriveEstimated: new Date(arriveEstimated).toISOString(),
        cancelled: routeIndex === routes.length - 1 && legIdx === 0 && routes.length > 1,
        platform,
        arrivalPlatform,
      });

      if (legIdx < route.legs.length - 1) {
        const nextPlatform = platformForLeg(route.legs[legIdx + 1], legIdx + 1);
        let gapMinutes = 1 + ((legIdx + routeIndex) % 3);
        if (!canMakeTransfer(gapMinutes, arrivalPlatform, nextPlatform)) {
          // Too tight for this platform gap - miss it, wait for the next service.
          gapMinutes += 10;
        }
        cursor = arriveEstimated + gapMinutes * 60_000;
      }
    });

    const first = legs[0];
    const last = legs[legs.length - 1];
    // Stable id (not routeIndex) so "show later trips" pagination can dedupe
    // against options already shown from an earlier call.
    const id = legs.map((l) => `${l.line}@${l.departScheduled}`).join('|');
    return {
      id,
      legs,
      departScheduled: first.departScheduled,
      departEstimated: first.departEstimated,
      arriveScheduled: last.arriveScheduled,
      arriveEstimated: last.arriveEstimated,
      totalMinutes: Math.round(
        (new Date(last.arriveEstimated).getTime() - new Date(first.departEstimated).getTime()) / 60_000,
      ),
    };
  });

  if (!arriveBy) {
    return options.sort((a, b) => a.totalMinutes - b.totalMinutes);
  }

  // Shift each option's whole timeline so its last leg arrives at baseTime,
  // instead of departing from it - relative gaps (and transfer feasibility)
  // are untouched by a uniform shift.
  const shifted = options.map((option) => {
    const shiftMs = baseTime - new Date(option.arriveEstimated).getTime();
    const shiftIso = (iso: string) => new Date(new Date(iso).getTime() + shiftMs).toISOString();
    return {
      ...option,
      departScheduled: shiftIso(option.departScheduled),
      departEstimated: shiftIso(option.departEstimated),
      arriveScheduled: shiftIso(option.arriveScheduled),
      arriveEstimated: shiftIso(option.arriveEstimated),
      legs: option.legs.map((leg) => ({
        ...leg,
        departScheduled: shiftIso(leg.departScheduled),
        departEstimated: shiftIso(leg.departEstimated),
        arriveScheduled: shiftIso(leg.arriveScheduled),
        arriveEstimated: shiftIso(leg.arriveEstimated),
      })),
    };
  });

  return shifted.sort((a, b) => a.totalMinutes - b.totalMinutes);
}

export class MockTransitClient implements TransitClient {
  async searchStops(query: string): Promise<Stop[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STOPS.filter((s) => s.name.toLowerCase().includes(q));
  }

  async nearbyStops(lat: number, lon: number): Promise<Stop[]> {
    return [...STOPS]
      .map((s) => ({ stop: s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6)
      .map((x) => x.stop);
  }

  async departures(stopId: string): Promise<Departure[]> {
    const stop = STOPS.find((s) => s.id === stopId);
    if (!stop) return [];
    return seededDepartures(stop);
  }

  async getStopsByIds(stopIds: string[]): Promise<Stop[]> {
    return STOPS.filter((s) => stopIds.includes(s.id));
  }

  async getLines(): Promise<TransportLine[]> {
    return LINE_DEFS.map(({ id, mode, name }) => ({ id, mode, name }));
  }

  async stopsForLine(lineId: string): Promise<Stop[]> {
    const line = LINE_DEFS.find((l) => l.id === lineId);
    if (!line) return [];
    return STOPS.filter((s) => line.stopIds.includes(s.id));
  }

  async popularStops(): Promise<Stop[]> {
    return STOPS.filter((s) => POPULAR_STOP_IDS.includes(s.id));
  }

  async allStops(): Promise<Stop[]> {
    return STOPS;
  }

  async planTrip(fromStopId: string, toStopId: string, options?: TripTimeOptions): Promise<TripOption[]> {
    const routes = findRoutes(fromStopId, toStopId);
    if (routes.length === 0) return [];
    const baseTime = options?.when?.getTime() ?? Date.now();
    return buildTripOptions(routes, baseTime, options?.arriveBy ?? false);
  }
}
