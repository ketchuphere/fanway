import { Language } from '../types/stadium';

export interface TranslationStrings {
  brandMission: string;
  navHome: string;
  navMap: string;
  navFood: string;
  navConcierge: string;
  navMatch: string;
  navSafety: string;
  navActivity: string;
  // Operator Nav
  opOverview: string;
  opQueue: string;
  opFood: string;
  opFacilities: string;
  opFeedback: string;
  opAnalytics: string;
  opSettings: string;
  // Roles
  roleFan: string;
  roleOperator: string;
  roleAdmin: string;
  demoModeLabel: string;
  // Home & Quick Actions
  askStadiumIQ: string;
  openStadiumMap: string;
  findFood: string;
  nearestWashroom: string;
  emergencyExits: string;
  firstAidHelp: string;
  yourSeatLocation: string;
  changeSeatEvent: string;
  liveQueueSnapshot: string;
  officialAnnouncements: string;
  // Safety notice
  safetyTranslationNotice?: string;
  emergencyBannerTitle: string;
  requestStaffHelp: string;
  reportIssue: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  en: {
    brandMission: 'Spend less time managing the stadium. Spend more time enjoying the match.',
    navHome: 'Home',
    navMap: 'Stadium Map',
    navFood: 'Food & Drinks',
    navConcierge: 'AI Concierge',
    navMatch: 'Match Center',
    navSafety: 'Help & Safety',
    navActivity: 'My Activity',
    opOverview: 'Overview',
    opQueue: 'Queue Monitor',
    opFood: 'Food & Inventory',
    opFacilities: 'Facilities',
    opFeedback: 'Fan Feedback',
    opAnalytics: 'Analytics',
    opSettings: 'Venue Settings',
    roleFan: 'Fan Companion',
    roleOperator: 'Venue Operator',
    roleAdmin: 'Administrator',
    demoModeLabel: 'Simulated Demo Environment · Metro Sports Arena',
    askStadiumIQ: 'Ask FanWay Concierge',
    openStadiumMap: 'Interactive Map',
    findFood: 'Food & Drinks',
    nearestWashroom: 'Washrooms',
    emergencyExits: 'Exits & Pickup',
    firstAidHelp: 'First Aid & Help',
    yourSeatLocation: 'Your Match-Day Seat & Zone',
    changeSeatEvent: 'Change Event / Seat',
    liveQueueSnapshot: 'Estimated Facility Queue Conditions',
    officialAnnouncements: 'Official Venue Announcements',
    emergencyBannerTitle: 'Official Emergency & Medical Dispatch',
    requestStaffHelp: 'Request Steward / Staff Assistance',
    reportIssue: 'Submit Facility Report',
  },
  hi: {
    brandMission: 'स्टेडियम प्रबंधन में कम समय बिताएं। मैच का आनंद लेने में अधिक समय बिताएं।',
    navHome: 'होम',
    navMap: 'स्टेडियम मैप',
    navFood: 'भोजन और पेय',
    navConcierge: 'AI सहायक',
    navMatch: 'मैच सेंटर',
    navSafety: 'सहायता और सुरक्षा',
    navActivity: 'मेरी गतिविधि',
    opOverview: 'अवलोकन (Overview)',
    opQueue: 'कतार मॉनिटर',
    opFood: 'भोजन और इन्वेंटरी',
    opFacilities: 'सुविधा प्रबंधन',
    opFeedback: 'प्रशंसक प्रतिक्रिया',
    opAnalytics: 'एनालिटिक्स',
    opSettings: 'वेन्यू सेटिंग्स',
    roleFan: 'प्रशंसक (Fan)',
    roleOperator: 'ऑपरेटर (Operator)',
    roleAdmin: 'एडमिन (Admin)',
    demoModeLabel: 'सिम्युलेटेड डेमो डेटा · मेट्रो स्पोर्ट्स एरिना',
    askStadiumIQ: 'FanWay AI से पूछें',
    openStadiumMap: 'इंटरैक्टिव मैप',
    findFood: 'भोजन खोजें',
    nearestWashroom: 'वॉशरूम',
    emergencyExits: 'निकास और पिकअप',
    firstAidHelp: 'प्राथमिक चिकित्सा',
    yourSeatLocation: 'आपकी सीट और प्रवेश द्वार',
    changeSeatEvent: 'इवेंट / सीट बदलें',
    liveQueueSnapshot: 'अनुमानित कतार स्थिति (Queue Status)',
    officialAnnouncements: 'आधिकारिक स्टेडियम घोषणाएं',
    safetyTranslationNotice:
      'सुरक्षा सूचना: पूर्ण सटीकता के लिए आधिकारिक आपातकालीन नंबर और निकास निर्देश अंग्रेजी और हिंदी दोनों में सत्यापित हैं। आपातकाल में तुरंत 112 या नजदीकी स्टीवर्ड से संपर्क करें।',
    emergencyBannerTitle: 'आधिकारिक आपातकालीन और चिकित्सा सहायता',
    requestStaffHelp: 'स्टाफ / व्हीलचेयर सहायता का अनुरोध करें',
    reportIssue: 'समस्या या फीडबैक दर्ज करें',
  },
  or: {
    brandMission: 'ଷ୍ଟାଡିୟମ୍ ପରିଚାଳନାରେ କମ୍ ସମୟ ଦିଅନ୍ତୁ। ମ୍ୟାଚ୍ উপଭୋଗ କରିବାରେ ଅଧିକ ସମୟ ବିତାନ୍ତୁ।',
    navHome: 'ହୋମ୍ (Home)',
    navMap: 'ଷ୍ଟାଡିୟମ୍ ମ୍ୟାପ୍',
    navFood: 'ଖାଦ୍ୟ ଓ ପାନୀୟ',
    navConcierge: 'AI ସହାୟକ',
    navMatch: 'ମ୍ୟାଚ୍ ସେଣ୍ଟର୍',
    navSafety: 'ସୁରକ୍ଷା ଓ ସହାୟତା',
    navActivity: 'ମୋ ଗତିବିଧି',
    opOverview: 'ସମୀକ୍ଷା (Overview)',
    opQueue: 'ଧାଡ଼ି ମନିଟର୍',
    opFood: 'ଖାଦ୍ୟ ତାଲିକା',
    opFacilities: 'ସୁବିଧା ପରିଚାଳନା',
    opFeedback: 'ଦର୍ଶକ ମତାମତ',
    opAnalytics: 'ଆନାଲିଟିକ୍ସ',
    opSettings: 'ଷ୍ଟାଡିୟମ୍ ସେଟିଂସ୍',
    roleFan: 'ଦର୍ଶକ (Fan)',
    roleOperator: 'ଅପରେଟର୍ (Operator)',
    roleAdmin: 'ଆଡମିନ୍ (Admin)',
    demoModeLabel: 'ସିମୁଲେଟେଡ୍ ଡେମୋ ଡାଟା · ମେଟ୍ରୋ ସ୍ପୋର୍ଟସ୍ ଏରିନା',
    askStadiumIQ: 'FanWay AI କୁ ପଚାରନ୍ତୁ',
    openStadiumMap: 'ଷ୍ଟାଡିୟମ୍ ମ୍ୟାପ୍ ଖୋଲନ୍ତୁ',
    findFood: 'ଖାଦ୍ୟ ଓ ପାନୀୟ',
    nearestWashroom: 'ଶୌଚାଳୟ (Washroom)',
    emergencyExits: 'ବାହାର ରାସ୍ତା ଓ ପିକଅପ୍',
    firstAidHelp: 'ପ୍ରାଥମିକ ଚିକିତ୍ସା',
    yourSeatLocation: 'ଆପଣଙ୍କ ସିଟ୍ ଓ ଗେଟ୍ ବିବରଣୀ',
    changeSeatEvent: 'ମ୍ୟାଚ୍ / ସିଟ୍ ବଦଳାନ୍ତୁ',
    liveQueueSnapshot: 'ଆନୁମାନିକ ଭିଡ଼ ଓ ଅପେକ୍ଷା ସମୟ',
    officialAnnouncements: 'ଅଫିସିଆଲ୍ ଷ୍ଟାଡିୟମ୍ ଘୋଷଣା',
    safetyTranslationNotice:
      'ସୁରକ୍ଷା ସୂଚନା: କେତେକ ବୈଷୟିକ ଜରୁରୀକାଳୀନ ନିର୍ଦ୍ଦେଶାବଳୀ ସଠିକତା ପାଇଁ ଇଂରାଜୀରେ ପ୍ରଦର୍ଶିତ ହୋଇଛି। ଜରୁରୀ ପରିସ୍ଥିତିରେ ତୁରନ୍ତ 112 କିମ୍ବା ନିକଟସ୍ଥ ଷ୍ଟାଡିୟମ୍ କର୍ମଚାରୀଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
    emergencyBannerTitle: 'ଅଫିସିଆଲ୍ ଜରୁରୀକାଳୀନ ଓ ଡାକ୍ତରୀ ସହାୟତା',
    requestStaffHelp: 'ଷ୍ଟାଫ୍ / ହ୍ୱିଲଚେୟାର ସହାୟତା ମାଗନ୍ତୁ',
    reportIssue: 'ସମସ୍ୟା ଜଣାନ୍ତୁ',
  },
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  or: 'ଓଡ଼ିଆ (Odia)',
};
