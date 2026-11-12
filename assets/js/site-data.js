// Public website ka sara text/data yahin hai. School apne hisaab se badal sakta hai (hi = Hindi, en = English).
// Photo: kisi bhi jagah photo:"uploads/naam.jpg" (ya https link) likh do to asli photo dikhegi, khali ho to demo drawing.
// Koi section khali [] kar do to woh website se chhup jaayega.
const b=(hi,en)=>({hi,en});
const SITE={
 logo:"",
 hero:{pre:b("सर्वश्रेष्ठ शिक्षा,","World-class learning,"),hl:b("उज्ज्वल भविष्य","brighter future"),
  sub:b("अनुभवी शिक्षक, आधुनिक कक्षाएँ और हर बच्चे पर व्यक्तिगत ध्यान — जहाँ सीखना आसान और मज़ेदार है।","Experienced teachers, modern classrooms and personal attention for every child — where learning is easy and fun."),
  badge:b("नया सत्र 2026-27 के लिए प्रवेश जारी","Admissions open for 2026-27"),happy:b("10,000+ खुश अभिभावक","10,000+ happy parents")},
 stats:[{i:"users",n:"1200+",l:b("छात्र","Students"),c:"#ede9fe",k:"#7c3aed"},{i:"book",n:"60+",l:b("अनुभवी शिक्षक","Expert teachers"),c:"#ffedd5",k:"#f97316"},{i:"award",n:"25+",l:b("वर्षों का अनुभव","Years of trust"),c:"#fce7f3",k:"#ec4899"},{i:"star",n:"98%",l:b("बोर्ड रिज़ल्ट","Board results"),c:"#d1fae5",k:"#10b981"}],
 classes:{title:b("हमारी कक्षाएँ और कार्यक्रम","Explore our classes"),e:b("शिक्षा","Academics"),
  items:[{i:"star",t:b("नर्सरी - UKG","Nursery - UKG"),x:b("खेल-खेल में सीखना","Learning through play"),c:"#fde2ef"},{i:"book",t:b("प्राथमिक (1-5)","Primary (1-5)"),x:b("नींव मज़बूत","Strong foundation"),c:"#d7f5ee"},
   {i:"globe",t:b("माध्यमिक (6-8)","Middle (6-8)"),x:b("जिज्ञासा और खोज","Curiosity & discovery"),c:"#ffe9a8"},{i:"cap",t:b("सेकेंडरी (9-10)","Secondary (9-10)"),x:b("बोर्ड की तैयारी","Board preparation"),c:"#e4d9ff"},
   {i:"flask",t:b("विज्ञान","Science"),x:b("प्रयोगशाला आधारित","Lab based"),c:"#d6e6ff"},{i:"pc",t:b("कंप्यूटर","Computer"),x:b("कोडिंग और स्किल","Coding & skills"),c:"#ffe0cc"},
   {i:"brush",t:b("कला और शिल्प","Art & craft"),x:b("रचनात्मकता","Creativity"),c:"#d4f5d9"},{i:"ball",t:b("खेल","Sports"),x:b("स्वस्थ शरीर","Fit & active"),c:"#ffd6ea"}]},
 banner:{t:b("सीखिए नई चीज़ें,","Learn new skills,"),hl:b("बनाइए अपना भविष्य","shape your future"),x:b("पढ़ाई के साथ खेल, कला, संगीत और कंप्यूटर — हर बच्चे की प्रतिभा को मंच।","Studies along with sports, art, music and computers — a stage for every child's talent."),btn:b("प्रवेश के लिए संपर्क करें","Enquire for admission")},
 popular:{title:b("लोकप्रिय गतिविधियाँ","Popular activities"),e:b("स्कूल लाइफ","School life"),
  items:[{i:"ball",t:b("खेल","Sports"),x:b("क्रिकेट, फुटबॉल, कबड्डी","Cricket, football, kabaddi"),c:"#c9f1ec"},{i:"music",t:b("संगीत और नृत्य","Music & dance"),x:b("गायन, वादन, नृत्य","Singing, instruments, dance"),c:"#ffe08a"},
   {i:"brush",t:b("कला","Art"),x:b("चित्रकला और शिल्प","Painting & craft"),c:"#ffc9e1"},{i:"pc",t:b("कंप्यूटर","Computers"),x:b("स्मार्ट क्लास, कोडिंग","Smart class, coding"),c:"#d4f5d9"}]},
 programs:{title:b("हमारे ख़ास कार्यक्रम","Explore featured programs"),e:b("ख़ास","Featured"),cats:[b("सभी","All"),b("पढ़ाई","Academics"),b("खेल","Sports"),b("कला","Arts"),b("स्किल","Skills")],
  items:[{cat:1,t:b("स्मार्ट क्लास शिक्षा","Smart class learning"),by:"Sunita Sharma",r:"4.9",m:b("कक्षा 1-8","Class 1-8"),icon:"book"},{cat:1,t:b("विज्ञान प्रयोगशाला","Science laboratory"),by:"Amit Verma",r:"4.8",m:b("कक्षा 6-10","Class 6-10"),icon:"flask"},
   {cat:2,t:b("क्रिकेट कोचिंग","Cricket coaching"),by:"Rahul Singh",r:"4.9",m:b("हर शाम","Every evening"),icon:"ball"},{cat:3,t:b("चित्रकला कार्यशाला","Art workshop"),by:"Neha Gupta",r:"4.7",m:b("सप्ताह में 2 दिन","2 days a week"),icon:"brush"},
   {cat:4,t:b("कंप्यूटर और कोडिंग","Computer & coding"),by:"Rohit Kumar",r:"4.8",m:b("कक्षा 3-10","Class 3-10"),icon:"pc"},{cat:3,t:b("संगीत एवं नृत्य","Music & dance"),by:"Pooja Yadav",r:"4.9",m:b("सप्ताह में 3 दिन","3 days a week"),icon:"music"},
   {cat:1,t:b("बोर्ड परीक्षा तैयारी","Board exam preparation"),by:"Anil Mishra",r:"4.9",m:b("कक्षा 9-10","Class 9-10"),icon:"cap"},{cat:2,t:b("वार्षिक खेल दिवस","Annual sports day"),by:"Rahul Singh",r:"5.0",m:b("हर साल","Every year"),icon:"trophy"}]},
 about:{e:b("हमारे बारे में","About us"),t:b("हर बच्चे के अनुसार","A school tailored to the"),hl:b("बनी शिक्षा","needs of every child"),
  text:b("हमारा स्कूल पढ़ाई, संस्कार और खेल — तीनों को साथ लेकर चलता है। छोटी कक्षाएँ, मेहनती शिक्षक और अभिभावकों से लगातार संवाद हमारी पहचान है।","Our school balances studies, values and sports. Small classes, dedicated teachers and constant communication with parents define us."),
  points:[b("छोटी कक्षाएँ, व्यक्तिगत ध्यान","Small classes, personal attention"),b("स्मार्ट क्लास और विज्ञान प्रयोगशाला","Smart classes & science lab"),b("सुरक्षित परिसर और बस सुविधा","Safe campus & bus facility"),b("अभिभावकों के लिए ऑनलाइन पोर्टल","Online portal for parents")],btn:b("हमसे जुड़ें","Join us")},
 principal:{name:"Principal Name",photo:"",message:b("हम हर बच्चे को आत्मविश्वासी और ज़िम्मेदार नागरिक बनाने के लिए प्रतिबद्ध हैं।","We are committed to making every child a confident and responsible citizen.")},
 admission:{t:b("प्रवेश जारी हैं। आज ही पूछताछ करें!","Admissions are open. Enquire today!"),x:b("अपनी जानकारी भरें, हम आपको वापस कॉल करेंगे।","Leave your details and we will call you back.")},
 notices:[{date:"2026-11-10",t:b("प्रवेश फॉर्म उपलब्ध","Admission forms available"),x:b("स्कूल ऑफिस से फॉर्म लें।","Collect forms from the school office.")},{date:"2026-11-25",t:b("अर्धवार्षिक परीक्षा","Half-yearly exams"),x:b("टाइम-टेबल पोर्टल पर देखें।","See the time-table on the portal.")},{date:"2026-12-05",t:b("अभिभावक-शिक्षक बैठक","Parent-teacher meeting"),x:b("सभी अभिभावक आमंत्रित हैं।","All parents are invited.")}],
 events:[{date:"2026-12-14",t:b("वार्षिक उत्सव","Annual day")},{date:"2027-01-26",t:b("गणतंत्र दिवस","Republic Day")},{date:"2027-02-10",t:b("खेल दिवस","Sports day")}],
 staff:[{name:"Sunita Sharma",role:b("प्रधानाध्यापिका","Head teacher"),photo:""},{name:"Amit Verma",role:b("विज्ञान शिक्षक","Science teacher"),photo:""},{name:"Neha Gupta",role:b("कला शिक्षिका","Art teacher"),photo:""},{name:"Rahul Singh",role:b("खेल प्रशिक्षक","Sports coach"),photo:""}],
 downloads:[]
};
