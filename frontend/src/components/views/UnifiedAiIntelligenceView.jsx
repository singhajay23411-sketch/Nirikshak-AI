import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Shield, AlertTriangle, CheckCircle2, Search, RefreshCw, Download,
  DollarSign, TrendingUp, Copy, Clock, Camera, Compass,
  ChevronDown, ChevronUp, FileText, Check, Play, Eye, ArrowRight,
  HelpCircle, AlertCircle, Sparkles, MapPin, X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';

// ─── SAMPLE POOL OF COMPREHENSIVE MPLADS PROJECTS ───
const SAMPLE_PROJECTS_POOL = [
  {
    id: 'MPLADS-2026-8871',
    title: 'Construction of Community Hall & Skill Center at Ward 14',
    titleHi: 'वार्ड 14 में सामुदायिक भवन एवं कौशल विकास केंद्र का निर्माण',
    category: 'Community Infrastructure',
    categoryHi: 'सामुदायिक अवसंरचना',
    state: 'Madhya Pradesh',
    stateHi: 'मध्य प्रदेश',
    district: 'Jabalpur',
    districtHi: 'जबलपुर',
    constituency: 'Jabalpur Lok Sabha',
    constituencyHi: 'जबलपुर लोकसभा',
    mpName: 'Shri Rakesh Singh',
    mpNameHi: 'श्री राकेश सिंह',
    house: 'Lok Sabha',
    houseHi: 'लोकसभा',
    sanctionedCost: '₹48,50,000',
    expenditure: '₹43,65,000',
    expenditurePct: 90,
    physicalProgress: 40,
    sanctionDate: '14 Jan 2024',
    targetDate: '15 Nov 2024',
    status: 'In Progress (Delayed)',
    statusHi: 'प्रगति पर (विलंबित)',
    agency: 'M/s Rural Infra Buildcon Ltd',
    agencyPriorFlags: 3,
    delayMonths: 11,
    costDeviationPct: 48,
    riskBandPreset: 'Critical',
    riskScorePreset: 87,
    coordinates: '23.1815° N, 79.9864° E'
  },
  {
    id: 'MPLADS-2026-9042',
    title: 'Installation of Solar Street Lighting & Micro-Grid in Block B',
    titleHi: 'ब्लॉक बी में सोलर स्ट्रीट लाइट एवं माइक्रो-ग्रिड स्थापना',
    category: 'Renewable Energy',
    categoryHi: 'नवीकरणीय ऊर्जा',
    state: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    district: 'Varanasi',
    districtHi: 'वाराणसी',
    constituency: 'Varanasi Lok Sabha',
    constituencyHi: 'वाराणसी लोकसभा',
    mpName: 'Smt. Darshana Singh',
    mpNameHi: 'श्रीमती दर्शना सिंह',
    house: 'Rajya Sabha',
    houseHi: 'राज्यसभा',
    sanctionedCost: '₹32,00,000',
    expenditure: '₹22,40,000',
    expenditurePct: 70,
    physicalProgress: 68,
    sanctionDate: '02 Mar 2024',
    targetDate: '30 Oct 2024',
    status: 'In Progress (On Track)',
    statusHi: 'प्रगति पर (समय पर)',
    agency: 'Varanasi Smart Solar Power Ltd',
    agencyPriorFlags: 0,
    delayMonths: 0,
    costDeviationPct: 5,
    riskBandPreset: 'Normal',
    riskScorePreset: 18,
    coordinates: '25.3176° N, 82.9739° E'
  },
  {
    id: 'MPLADS-2026-7734',
    title: 'Upgradation of District Primary Health Center Ward 7',
    titleHi: 'वार्ड 7 में जिला प्राथमिक स्वास्थ्य केंद्र का उन्नयन',
    category: 'Healthcare Infrastructure',
    categoryHi: 'स्वास्थ्य अवसंरचना',
    state: 'Nagaland',
    stateHi: 'नागालैंड',
    district: 'Kohima',
    districtHi: 'कोहिमा',
    constituency: 'Sitting Rajya Sabha, Nagaland',
    constituencyHi: 'राज्यसभा सदस्य, नागालैंड',
    mpName: 'Smt. S. Phangnon Konyak',
    mpNameHi: 'श्रीमती एस. फांगनों कोन्याक',
    house: 'Rajya Sabha',
    houseHi: 'राज्यसभा',
    sanctionedCost: '₹75,00,000',
    expenditure: '₹67,50,000',
    expenditurePct: 90,
    physicalProgress: 52,
    sanctionDate: '10 Feb 2024',
    targetDate: '20 Sep 2024',
    status: 'In Progress (Review Needed)',
    statusHi: 'प्रगति पर (समीक्षा आवश्यक)',
    agency: 'Eastern Hill Construction Corp',
    agencyPriorFlags: 1,
    delayMonths: 6,
    costDeviationPct: 34,
    riskBandPreset: 'Medium',
    riskScorePreset: 58,
    coordinates: '25.6751° N, 94.1086° E'
  },
  {
    id: 'MPLADS-2026-6190',
    title: 'Construction of Overbridge Approach Road & Culverts at NH-30',
    titleHi: 'एनएच-30 पर ओवरब्रिज पहुंच मार्ग एवं पुलिया निर्माण',
    category: 'Transport & Roads',
    categoryHi: 'सड़क एवं परिवहन',
    state: 'Bihar',
    stateHi: 'बिहार',
    district: 'Patna',
    districtHi: 'पटना',
    constituency: 'Patna Sahib Lok Sabha',
    constituencyHi: 'पटना साहिब लोकसभा',
    mpName: 'Shri Ravi Shankar Prasad',
    mpNameHi: 'श्री रवि शंकर प्रसाद',
    house: 'Lok Sabha',
    houseHi: 'लोकसभा',
    sanctionedCost: '₹1,20,00,000',
    expenditure: '₹1,18,00,000',
    expenditurePct: 98,
    physicalProgress: 35,
    sanctionDate: '20 Nov 2023',
    targetDate: '15 Jul 2024',
    status: 'Severely Delayed',
    statusHi: 'अत्यधिक विलंबित',
    agency: 'Ganga Valley Infrastructure JV',
    agencyPriorFlags: 4,
    delayMonths: 14,
    costDeviationPct: 62,
    riskBandPreset: 'Critical',
    riskScorePreset: 91,
    coordinates: '25.5941° N, 85.1376° E'
  },
  {
    id: 'MPLADS-2026-5512',
    title: 'Digital Smart Classroom & Science Laboratory in Govt High School',
    titleHi: 'शासकीय उच्च विद्यालय में डिजिटल स्मार्ट क्लासरूम एवं विज्ञान प्रयोगशाला',
    category: 'Education & Technology',
    categoryHi: 'शिक्षा एवं प्रौद्योगिकी',
    state: 'Rajasthan',
    stateHi: 'राजस्थान',
    district: 'Jaipur',
    districtHi: 'जयपुर',
    constituency: 'Jaipur Rural Lok Sabha',
    constituencyHi: 'जयपुर ग्रामीण लोकसभा',
    mpName: 'Col. Rajyavardhan Singh Rathore',
    mpNameHi: 'कर्नल राज्यवर्धन सिंह राठौड़',
    house: 'Lok Sabha',
    houseHi: 'लोकसभा',
    sanctionedCost: '₹28,00,000',
    expenditure: '₹28,00,000',
    expenditurePct: 100,
    physicalProgress: 100,
    sanctionDate: '05 Jan 2024',
    targetDate: '30 May 2024',
    status: 'Completed & Verified',
    statusHi: 'पूर्ण एवं सत्यापित',
    agency: 'Jaipur EdTech Solutions Ltd',
    agencyPriorFlags: 0,
    delayMonths: 0,
    costDeviationPct: 2,
    riskBandPreset: 'Normal',
    riskScorePreset: 12,
    coordinates: '26.9124° N, 75.7873° E'
  }
];

const UnifiedAiIntelligenceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // 1. Initial Selected Project
  const initialProject = useMemo(() => {
    const passed = location.state?.project;
    if (passed) return passed;

    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      const match = SAMPLE_PROJECTS_POOL.find(p => p.id.toLowerCase() === projectIdParam.toLowerCase());
      if (match) return match;
    }

    return SAMPLE_PROJECTS_POOL[0];
  }, [location.state, searchParams]);

  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 2. Execution State (Starts in IDLE state — NO AUTO RUN)
  const [isUnifiedRunning, setIsUnifiedRunning] = useState(false);
  const [modelsState, setModelsState] = useState({
    financial: { status: 'idle' },
    cost: { status: 'idle' },
    duplicate: { status: 'idle' },
    delay: { status: 'idle' },
    evidence: { status: 'idle' },
    geospatial: { status: 'idle' }
  });

  // Track if any model has been completed
  const completedCount = useMemo(() => {
    return Object.values(modelsState).filter(m => m.status === 'completed').length;
  }, [modelsState]);

  const hasAnyCompleted = completedCount > 0;
  const isAllCompleted = completedCount === 6;

  // Search filter
  const filteredProjectsList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SAMPLE_PROJECTS_POOL;
    return SAMPLE_PROJECTS_POOL.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.titleHi && p.titleHi.includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (p.districtHi && p.districtHi.includes(q)) ||
      p.state.toLowerCase().includes(q) ||
      p.mpName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // When project changes, reset model statuses to idle
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsUnifiedRunning(false);
    setModelsState({
      financial: { status: 'idle' },
      cost: { status: 'idle' },
      duplicate: { status: 'idle' },
      delay: { status: 'idle' },
      evidence: { status: 'idle' },
      geospatial: { status: 'idle' }
    });
  };

  // 3. Models Definition with Bilingual Translations
  const modelsList = useMemo(() => [
    {
      id: 'financial',
      title: isHi ? 'वित्तीय विसंगति पहचान' : 'Financial Anomaly Detection',
      description: isHi
        ? 'यह जांचता है कि खर्च किया गया धन जमीनी स्तर पर पूर्ण किए गए वास्तविक भौतिक कार्य से मेल खाता है या नहीं।'
        : 'Checks if money spent matches the actual physical work completed on site.',
      icon: DollarSign
    },
    {
      id: 'cost',
      title: isHi ? 'लागत वृद्धि पहचान' : 'Cost Overrun Detection',
      description: isHi
        ? 'अतिरिक्त बिलिंग की जांच के लिए मानक सरकारी दरों (SoR) के साथ परियोजना लागत की तुलना करता है।'
        : 'Compares the project cost with standard government rates to check for overcharging.',
      icon: TrendingUp
    },
    {
      id: 'duplicate',
      title: isHi ? 'दोहरी परियोजना पहचान' : 'Duplicate Project Detection',
      description: isHi
        ? 'यह जांचता है कि क्या यह कार्य पहले से ही किसी अन्य योजना के तहत वित्तपोषित या निर्मित तो नहीं है।'
        : 'Checks if this exact work was already funded or built under another scheme nearby.',
      icon: Copy
    },
    {
      id: 'delay',
      title: isHi ? 'विलंब जोखिम पूर्वानुमान' : 'Delay Risk Prediction',
      description: isHi
        ? 'यह पूर्वानुमान लगाता है कि क्या ठेकेदार द्वारा परियोजना में देरी या उसे अधूरा छोड़ने का जोखिम है।'
        : 'Predicts whether the project is at risk of getting delayed or abandoned by the contractor.',
      icon: Clock
    },
    {
      id: 'evidence',
      title: isHi ? 'साक्ष्य एवं फोटो सत्यापन' : 'Evidence Verification',
      description: isHi
        ? 'साइट निरीक्षण तस्वीरों, जीपीएस स्थान सटीकता और पूर्णता बिलों का सत्यापन करता है।'
        : 'Verifies site inspection photos, GPS location accuracy, and completion bills.',
      icon: Camera
    },
    {
      id: 'geospatial',
      title: isHi ? 'भू-स्थानिक विश्लेषण' : 'Geospatial Intelligence',
      description: isHi
        ? 'पुष्टि करता है कि कार्य आधिकारिक निर्वाचन क्षेत्र की सीमाओं के भीतर स्थित है।'
        : 'Confirms that the work is located inside the official constituency boundaries.',
      icon: Compass
    }
  ], [isHi]);

  // 4. Bilingual Analysis Findings for Selected Project
  const analysisData = useMemo(() => {
    const p = selectedProject;
    const gap = p.expenditurePct - p.physicalProgress;
    const isCostHigh = p.costDeviationPct > 15;
    const isDelayed = p.delayMonths > 2;
    const isDuplicateAlert = p.riskBandPreset === 'Critical';
    const isEvidenceAlert = p.riskBandPreset === 'Critical';

    // Model 1: Financial Anomaly
    const financial = {
      isProblem: gap > 15,
      severity: gap > 30 ? (isHi ? 'गंभीर' : 'Critical') : gap > 15 ? (isHi ? 'चेतावनी' : 'Warning') : (isHi ? 'सामान्य' : 'Normal'),
      severityRaw: gap > 30 ? 'Critical' : gap > 15 ? 'Warning' : 'Normal',
      modelName: isHi ? 'वित्तीय विसंगति पहचान' : 'Financial Anomaly Detection',
      finding: gap > 15
        ? isHi
          ? `₹${p.expenditure} खर्च किए जा चुके हैं (${p.expenditurePct}%), लेकिन केवल ${p.physicalProgress}% भौतिक कार्य पूरा हुआ है।`
          : `₹${p.expenditure} has been spent (${p.expenditurePct}%), but only ${p.physicalProgress}% physical work is completed.`
        : isHi
          ? `खर्च की गई राशि (${p.expenditurePct}%) प्रमाणित भौतिक प्रगति (${p.physicalProgress}%) के बिल्कुल अनुरूप है।`
          : `Money spent (${p.expenditurePct}%) matches the certified physical completion (${p.physicalProgress}%).`,
      why: isHi
        ? 'जमीन पर निर्माण चरणों के सत्यापन से पहले ही बड़ी अग्रिम धनराशि जारी कर दी गई थी।'
        : 'Large advance funds were disbursed before physical construction milestones were verified on ground.',
      evidence: isHi
        ? `${p.expenditurePct}% धनराशि जारी vs ${p.physicalProgress}% भौतिक प्रगति (+${gap}% अंतर)।`
        : `${p.expenditurePct}% funds disbursed vs ${p.physicalProgress}% verified progress (+${gap}% gap).`,
      action: isHi
        ? 'आगे की धनराशि जारी करने से पहले भुगतान वाउचरों का ऑडिट करें और वास्तविक साइट का निरीक्षण करें।'
        : 'Audit payment vouchers and inspect physical site before releasing further funds.'
    };

    // Model 2: Cost Overrun
    const cost = {
      isProblem: isCostHigh,
      severity: p.costDeviationPct > 40 ? (isHi ? 'गंभीर' : 'Critical') : isCostHigh ? (isHi ? 'चेतावनी' : 'Warning') : (isHi ? 'सामान्य' : 'Normal'),
      severityRaw: p.costDeviationPct > 40 ? 'Critical' : isCostHigh ? 'Warning' : 'Normal',
      modelName: isHi ? 'लागत वृद्धि पहचान' : 'Cost Overrun Detection',
      finding: isCostHigh
        ? isHi
          ? `परियोजना की अनुमानित लागत मानक सरकारी दरों (SoR) से ${p.costDeviationPct}% अधिक है।`
          : `Project estimated cost is ${p.costDeviationPct}% higher than standard government Schedule of Rates (SoR).`
        : isHi
          ? `परियोजना की लागत मानक सरकारी दरों के दायरे (±5%) में है।`
          : `Project cost is within standard government rates (±5% baseline).`,
      why: isHi
        ? `इकाई लागत ${p.districtHi || p.district} में तुलनीय अन्य निर्माण कार्यों की तुलना में काफी अधिक है।`
        : `The unit cost significantly exceeds comparable municipal works in ${p.district}.`,
      evidence: isHi
        ? `इकाई दर ${p.stateHi || p.state} PWD मानक दर से ${p.costDeviationPct}% अधिक है।`
        : `Unit rate is ${p.costDeviationPct}% above ${p.state} PWD rate baseline.`,
      action: isHi
        ? 'जिला अधिशासी अभियंता के साथ विस्तृत बिल ऑफ क्वांटिटी (BOQ) की समीक्षा करें।'
        : 'Review the detailed bill of quantities (BOQ) with the District Executive Engineer.'
    };

    // Model 3: Duplicate Project
    const duplicate = {
      isProblem: isDuplicateAlert,
      severity: isDuplicateAlert ? (isHi ? 'चेतावनी' : 'Warning') : (isHi ? 'सामान्य' : 'Normal'),
      severityRaw: isDuplicateAlert ? 'Warning' : 'Normal',
      modelName: isHi ? 'दोहरी परियोजना पहचान' : 'Duplicate Project Detection',
      finding: isDuplicateAlert
        ? isHi
          ? 'संभावित दोहरे कार्य का अलर्ट: 180 मीटर के दायरे में समान सामुदायिक संरचना मिली है।'
          : 'Potential duplicate work: identical community structure found within 180 meters.'
        : isHi
          ? 'इस क्षेत्र में कोई दोहरा या परस्पर विरोधी कार्य नहीं पाया गया।'
          : 'No duplicate or overlapping works detected in this area.',
      why: isHi
        ? 'उसी वार्ड में किसी अन्य स्थानीय सरकारी योजना द्वारा समान निर्माण कार्य को वित्तपोषित किया गया था।'
        : 'Another local government scheme funded similar construction in the same ward.',
      evidence: isHi
        ? `${p.districtHi || p.district} में मौजूदा नगरपालिका संपत्ति रिकॉर्ड से 180 मीटर की निकटता।`
        : 'High spatial proximity (180m) to existing municipal asset record.',
      action: isHi
        ? 'दोहरे बिलिंग से बचने के लिए स्थानीय नगर पालिका और राज्य योजना संपत्ति रिकॉर्ड की जांच करें।'
        : 'Cross-check local municipality asset records to prevent duplicate billing.'
    };

    // Model 4: Delay Risk
    const delay = {
      isProblem: isDelayed,
      severity: p.delayMonths > 8 ? (isHi ? 'गंभीर' : 'Critical') : isDelayed ? (isHi ? 'चेतावनी' : 'Warning') : (isHi ? 'सामान्य' : 'Normal'),
      severityRaw: p.delayMonths > 8 ? 'Critical' : isDelayed ? 'Warning' : 'Normal',
      modelName: isHi ? 'विलंब जोखिम पूर्वानुमान' : 'Delay Risk Prediction',
      finding: isDelayed
        ? isHi
          ? `परियोजना अपने निर्धारित पूर्णता लक्ष्य से ${p.delayMonths} महीने विलंबित है।`
          : `Project is delayed by ${p.delayMonths} months past its scheduled completion target.`
        : isHi
          ? 'परियोजना बिना किसी ठेकेदार विलंब के निर्धारित समय पर चल रही है।'
          : 'Project is progressing on schedule with zero contractor delay flags.',
      why: isHi
        ? `ठेकेदार के पास ${p.agencyPriorFlags} पिछले डिफॉल्ट रिकॉर्ड हैं और कार्य लक्ष्य तिथि (${p.targetDate}) से आगे बढ़ गया है।`
        : `Contractor has ${p.agencyPriorFlags} prior default flags and work has stalled past the target date (${p.targetDate}).`,
      evidence: isHi
        ? `स्वीकृति ${p.sanctionDate} में हुई, लक्ष्य ${p.targetDate} था, लेकिन कार्य केवल ${p.physicalProgress}% ही पूरा हुआ है।`
        : `Sanctioned in ${p.sanctionDate}, target was ${p.targetDate}, but work is only ${p.physicalProgress}% complete.`,
      action: isHi
        ? 'ठेकेदार को कारण बताओ नोटिस जारी करें और शेष कार्य के लिए सख्त समय-सीमा तय करें।'
        : 'Issue a notice to the contractor and set a strict deadline for the remaining work.'
    };

    // Model 5: Evidence Verification
    const evidence = {
      isProblem: isEvidenceAlert,
      severity: isEvidenceAlert ? (isHi ? 'गंभीर' : 'Critical') : (isHi ? 'सामान्य' : 'Normal'),
      severityRaw: isEvidenceAlert ? 'Critical' : 'Normal',
      modelName: isHi ? 'साक्ष्य एवं फोटो सत्यापन' : 'Evidence Verification',
      finding: isEvidenceAlert
        ? isHi
          ? 'साइट निरीक्षण तस्वीरों में निर्देशांक विसंगति या फोटो का पुन: उपयोग पाया गया है।'
          : 'Site inspection photos show coordinate discrepancies or potential image reuse.'
        : isHi
          ? 'सभी निरीक्षण तस्वीरों में प्रामाणिक जीपीएस जियोटैग और वैध समय-मुहर (Timestamp) मौजूद हैं।'
          : 'All inspection photos have authentic GPS geotags and valid timestamps.',
      why: isHi
        ? 'अपलोड की गई फोटो का स्थान स्वीकृत परियोजना स्थल निर्देशांक से मेल नहीं खाता है।'
        : 'The uploaded photo location does not match the sanctioned project site coordinates.',
      evidence: isHi
        ? 'जीपीएस सटीकता में विसंगति पाई गई (±140m का अंतर)।'
        : 'GPS accuracy discrepancy detected (off by ±140m).',
      action: isHi
        ? 'लाइव जियोटैग की गई मोबाइल फोटो के साथ भौतिक साइट निरीक्षण करें।'
        : 'Conduct a physical field inspection with live geotagged photo capture.'
    };

    // Model 6: Geospatial Intelligence
    const geospatial = {
      isProblem: false,
      severity: isHi ? 'सामान्य' : 'Normal',
      severityRaw: 'Normal',
      modelName: isHi ? 'भू-स्थानिक विश्लेषण' : 'Geospatial Intelligence',
      finding: isHi
        ? `परियोजना स्थल (${p.coordinates}) ${p.constituencyHi || p.constituency} की सीमाओं के अंदर होने की पुष्टि हुई है।`
        : `Project location (${p.coordinates}) is confirmed inside ${p.constituency} boundaries.`,
      why: '',
      evidence: isHi
        ? 'निर्देशांक आधिकारिक निर्वाचन क्षेत्र जीआईएस सीमा बहुभुज से मेल खाते हैं।'
        : 'Coordinates match official constituency GIS boundary polygon.',
      action: isHi ? 'स्थान सत्यापित।' : 'Location verified.'
    };

    // Consolidated Problems & Verified Lists
    const problemsList = [];
    const verifiedList = [];

    if (financial.isProblem) problemsList.push(financial);
    else verifiedList.push({ modelName: financial.modelName, title: financial.finding });

    if (cost.isProblem) problemsList.push(cost);
    else verifiedList.push({ modelName: cost.modelName, title: cost.finding });

    if (duplicate.isProblem) problemsList.push(duplicate);
    else verifiedList.push({ modelName: duplicate.modelName, title: duplicate.finding });

    if (delay.isProblem) problemsList.push(delay);
    else verifiedList.push({ modelName: delay.modelName, title: delay.finding });

    if (evidence.isProblem) problemsList.push(evidence);
    else verifiedList.push({ modelName: evidence.modelName, title: evidence.finding });

    if (geospatial.isProblem) problemsList.push(geospatial);
    else verifiedList.push({ modelName: geospatial.modelName, title: geospatial.finding });

    const criticalCount = problemsList.filter(p => p.severityRaw === 'Critical').length;
    const warningCount = problemsList.filter(p => p.severityRaw === 'Warning').length;

    const riskLevelRaw = criticalCount > 0 ? 'Critical' : warningCount > 0 ? 'Medium' : 'Normal';
    const riskLevel = isHi
      ? (riskLevelRaw === 'Critical' ? 'गंभीर' : riskLevelRaw === 'Medium' ? 'मध्यम' : 'सामान्य')
      : riskLevelRaw;

    const riskScore = p.riskScorePreset || (criticalCount > 0 ? 87 : warningCount > 0 ? 54 : 15);
    const scoreColor = riskLevelRaw === 'Critical' ? '#D9534F' : riskLevelRaw === 'Medium' ? '#B8860B' : '#1E7E34';
    const scoreBg = riskLevelRaw === 'Critical' ? '#FFEBEE' : riskLevelRaw === 'Medium' ? '#FFF8E1' : '#E8F5E9';

    // Simple Executive Summary in Hindi and English
    let summaryText = '';
    if (riskLevelRaw === 'Critical') {
      summaryText = isHi
        ? `इस परियोजना में तत्काल ध्यान देने योग्य गंभीर समस्याएं हैं। ₹${p.expenditure} वितरित किए जा चुके हैं, लेकिन साइट पर केवल ${p.physicalProgress}% भौतिक कार्य ही पूरा हुआ है। इसमें अत्यधिक लागत वृद्धि और ${p.delayMonths} महीने का विलंब भी है। तत्काल भौतिक निरीक्षण की सिफारिश की जाती है।`
        : `This project has critical issues requiring urgent attention. ₹${p.expenditure} has been disbursed, but only ${p.physicalProgress}% physical progress has been completed on site. There is also a severe cost overrun and project delay of ${p.delayMonths} months. Immediate physical inspection is recommended.`;
    } else if (riskLevelRaw === 'Medium') {
      summaryText = isHi
        ? `इस परियोजना में कुछ विसंगतियां हैं जिनकी समीक्षा की जानी चाहिए। यद्यपि धनराशि का उपयोग किया जा रहा है, प्रगति ${p.costDeviationPct}% लागत भिन्नता के साथ अपेक्षित से धीमी है। स्थानीय अधिकारियों को बिलों की समीक्षा करनी चाहिए और कार्य में तेजी लानी चाहिए।`
        : `This project has minor discrepancies that should be reviewed. While funds are being utilized, progress is slower than expected with a ${p.costDeviationPct}% cost variation. Local authorities should review the bills and expedite the pending work.`;
    } else {
      summaryText = isHi
        ? `यह परियोजना पूरी तरह से स्वस्थ और सत्यापित है। फंड वितरण साइट पर भौतिक प्रगति से मेल खाता है, लागत मानक सरकारी दरों के भीतर है, और सभी जियोटैग की गई तस्वीरें प्रामाणिक हैं। कोई अनियमितता नहीं मिली।`
        : `This project is healthy and verified. Fund disbursals match physical progress on site, project costs are within standard government rates, and all geotagged photos are authentic. No irregularities found.`;
    }

    return {
      financial,
      cost,
      duplicate,
      delay,
      evidence,
      geospatial,
      problemsList,
      verifiedList,
      criticalCount,
      warningCount,
      riskLevel,
      riskScore,
      scoreColor,
      scoreBg,
      summaryText
    };
  }, [selectedProject, isHi]);

  // 5. Run All 6 Models (Unified Analysis)
  const runUnifiedAnalysis = () => {
    setIsUnifiedRunning(true);

    setModelsState({
      financial: { status: 'running' },
      cost: { status: 'running' },
      duplicate: { status: 'running' },
      delay: { status: 'running' },
      evidence: { status: 'running' },
      geospatial: { status: 'running' }
    });

    const timers = [];
    timers.push(setTimeout(() => { setModelsState(prev => ({ ...prev, financial: { status: 'completed' } })); }, 500));
    timers.push(setTimeout(() => { setModelsState(prev => ({ ...prev, cost: { status: 'completed' } })); }, 900));
    timers.push(setTimeout(() => { setModelsState(prev => ({ ...prev, duplicate: { status: 'completed' } })); }, 1300));
    timers.push(setTimeout(() => { setModelsState(prev => ({ ...prev, delay: { status: 'completed' } })); }, 1700));
    timers.push(setTimeout(() => { setModelsState(prev => ({ ...prev, evidence: { status: 'completed' } })); }, 2100));
    timers.push(setTimeout(() => {
      setModelsState(prev => ({ ...prev, geospatial: { status: 'completed' } }));
      setIsUnifiedRunning(false);
    }, 2500));
  };

  // 6. Run Single Model Individually
  const runSingleModel = (modelId) => {
    setModelsState(prev => ({
      ...prev,
      [modelId]: { status: 'running' }
    }));

    setTimeout(() => {
      setModelsState(prev => ({
        ...prev,
        [modelId]: { status: 'completed' }
      }));
    }, 600);
  };

  // 7. Download Simple Human-Readable Report
  const handleDownloadSimpleReport = () => {
    const reportText = `=====================================================
${isHi ? 'एमपीलैड्स एकीकृत विश्लेषण रिपोर्ट' : 'MPLADS UNIFIED ANALYSIS REPORT'}
${isHi ? 'परियोजना ID' : 'Project ID'}: ${selectedProject.id}
${isHi ? 'दिनांक' : 'Generated On'}: ${new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
=====================================================

1. ${isHi ? 'परियोजना विवरण' : 'PROJECT SUMMARY'}
- ${isHi ? 'शीर्षक' : 'Title'}: ${isHi ? (selectedProject.titleHi || selectedProject.title) : selectedProject.title}
- ${isHi ? 'निर्वाचन क्षेत्र' : 'Constituency'}: ${isHi ? (selectedProject.constituencyHi || selectedProject.constituency) : selectedProject.constituency}
- ${isHi ? 'सांसद' : 'Member of Parliament'}: ${isHi ? (selectedProject.mpNameHi || selectedProject.mpName) : selectedProject.mpName}
- ${isHi ? 'आवंटित राशि' : 'Sanctioned Amount'}: ${selectedProject.sanctionedCost}
- ${isHi ? 'व्यय की गई राशि' : 'Expenditure Disbursed'}: ${selectedProject.expenditure} (${selectedProject.expenditurePct}%)
- ${isHi ? 'भौतिक प्रगति' : 'Physical Progress'}: ${selectedProject.physicalProgress}%
- ${isHi ? 'कार्यकारी एजेंसी' : 'Implementing Agency'}: ${selectedProject.agency}

2. ${isHi ? 'समग्र मूल्यांकन' : 'OVERALL ASSESSMENT'}
- ${isHi ? 'जोखिम स्तर' : 'Risk Level'}: ${analysisData.riskLevel.toUpperCase()}
- ${isHi ? 'जोखिम स्कोर' : 'Risk Score'}: ${analysisData.riskScore} / 100
- ${isHi ? 'जांच पूर्ण' : 'Checks Completed'}: ${completedCount} / 6

3. ${isHi ? 'कार्यकारी सारांश' : 'EXECUTIVE SUMMARY'}
${analysisData.summaryText}

4. ${isHi ? 'पाई गई समस्याएं' : 'PROBLEMS FOUND'} (${analysisData.problemsList.length})
${analysisData.problemsList.length === 0 ? (isHi ? 'कोई समस्या नहीं मिली। परियोजना पूरी तरह से सत्यापित और सुरक्षित है।' : 'No problems found. Project is verified and clean.') : analysisData.problemsList.map((prob, idx) => `
[${isHi ? 'समस्या' : 'Problem'} ${idx + 1}] ${prob.modelName} (${isHi ? 'गंभीरता' : 'Severity'}: ${prob.severity})
• ${isHi ? 'समस्या क्या है' : 'What is wrong'}: ${prob.finding}
• ${isHi ? 'यह समस्या क्यों है' : 'Why it is a problem'}: ${prob.why}
• ${isHi ? 'साक्ष्य / डेटा' : 'Evidence'}: ${prob.evidence}
• ${isHi ? 'सिफारिशित कार्रवाई' : 'Recommended Action'}: ${prob.action}
`).join('\n')}

5. ${isHi ? 'सत्यापित एवं सामान्य जांच' : 'VERIFIED & NORMAL CHECKS'} (${analysisData.verifiedList.length})
${analysisData.verifiedList.map((ver, idx) => `✓ ${ver.modelName}: ${ver.title}`).join('\n')}

=====================================================
${isHi ? 'निरीक्षक एआई - सार्वजनिक पारदर्शिता पोर्टल द्वारा जनरेट की गई रिपोर्ट' : 'Report generated by Nirikshak AI — Public Transparency Portal'}
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Unified_Analysis_${selectedProject.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. BREADCRUMB ─── */}
      <div style={{ paddingTop: '1.25rem', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{isHi ? 'होम' : 'Home'}</span>
          <span>/</span>
          <span>MPLADS</span>
          <span>/</span>
          <span style={{ color: '#0A2458', fontWeight: 700 }}>{isHi ? 'एकीकृत विश्लेषण' : 'Unified Analysis'}</span>
        </div>
      </div>

      {/* ─── 2. PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1D1E22',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.2
            }}
          >
            {isHi ? 'एकीकृत विश्लेषण' : 'Unified Analysis'}
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '720px', lineHeight: 1.45 }}>
            {isHi
              ? 'एक ही एकीकृत विश्लेषण में कई एआई मॉडलों का उपयोग करके किसी भी एमपीलैड्स परियोजना का विश्लेषण करें।'
              : 'Analyze any MPLADS project using multiple AI models in a single unified analysis.'}
          </p>
        </div>

        {/* Primary Action Button: Run AI Analysis / Re-run */}
        <button
          type="button"
          onClick={runUnifiedAnalysis}
          disabled={isUnifiedRunning}
          className="btn-teal"
          style={{
            padding: '0.75rem 1.75rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: isUnifiedRunning ? 'not-allowed' : 'pointer',
            opacity: isUnifiedRunning ? 0.75 : 1
          }}
        >
          {isUnifiedRunning ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              <span>{isHi ? 'सभी 6 मॉडलों का विश्लेषण जारी है...' : 'Analyzing All 6 Models...'}</span>
            </>
          ) : isAllCompleted ? (
            <>
              <RefreshCw size={17} />
              <span>{isHi ? 'पुनः विश्लेषण करें' : 'Re-run AI Analysis'}</span>
            </>
          ) : (
            <>
              <Play size={17} fill="currentColor" />
              <span>{isHi ? 'सभी 6 मॉडलों का विश्लेषण करें' : 'Run AI Analysis'}</span>
            </>
          )}
        </button>
      </div>

      {/* ─── 3. PROJECT SELECTOR & DETAILS CARD ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.5rem 1.75rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'चयनित परियोजना' : 'SELECTED PROJECT'}
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: '0.2rem 0 0 0' }}>
              {isHi ? (selectedProject.titleHi || selectedProject.title) : selectedProject.title}
            </h3>
          </div>

          {/* Project Search Dropdown */}
          <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{
                width: '100%',
                padding: '0.6rem 0.9rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                background: '#FAF8F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                <Search size={14} color="#0A2458" />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {selectedProject.id} ({isHi ? (selectedProject.districtHi || selectedProject.district) : selectedProject.district})
                </span>
              </div>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Menu */}
            {isSearchOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '380px',
                  maxWidth: '90vw',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '4px 6px 0px #1D1E22',
                  zIndex: 100,
                  padding: '0.75rem'
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isHi ? 'परियोजना ID, जिला या सांसद खोजें...' : 'Search project ID, district, or MP...'}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.82rem',
                    border: '1.2px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    marginBottom: '0.5rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {filteredProjectsList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProject(item)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: selectedProject.id === item.id ? '#F3EFE6' : 'transparent',
                        border: selectedProject.id === item.id ? '1px solid #1D1E22' : '1px solid transparent',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => { if (selectedProject.id !== item.id) e.currentTarget.style.background = '#FAF8F3'; }}
                      onMouseLeave={(e) => { if (selectedProject.id !== item.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace' }}>{item.id}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {isHi ? (item.districtHi || item.district) : item.district}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1D1E22', marginTop: '0.2rem', lineHeight: 1.25 }}>
                        {isHi ? (item.titleHi || item.title) : item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Meta Key-Value Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
            gap: '0.85rem',
            background: '#FAF8F3',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(29,30,34,0.12)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {isHi ? 'परियोजना ID' : 'PROJECT ID'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'monospace', color: '#1D1E22', marginTop: '0.2rem' }}>{selectedProject.id}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {isHi ? 'निर्वाचन क्षेत्र / सांसद' : 'CONSTITUENCY / MP'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>
              {isHi ? (selectedProject.constituencyHi || selectedProject.constituency) : selectedProject.constituency}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
              {isHi ? (selectedProject.mpNameHi || selectedProject.mpName) : selectedProject.mpName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {isHi ? 'आवंटित राशि' : 'SANCTIONED AMOUNT'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>{selectedProject.sanctionedCost}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {isHi ? 'व्यय की गई राशि' : 'EXPENDITURE DISBURSED'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0A2458', marginTop: '0.2rem' }}>
              {selectedProject.expenditure} ({selectedProject.expenditurePct}%)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {isHi ? 'भौतिक प्रगति' : 'PHYSICAL PROGRESS'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: selectedProject.physicalProgress >= 70 ? '#1E7E34' : '#D9534F', marginTop: '0.2rem' }}>
              {selectedProject.physicalProgress}% {isHi ? 'पूर्ण' : 'Completed'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. CONSOLIDATED SIMPLE REPORT (APPEARS AFTER AT LEAST 1 MODEL OR UNIFIED RUNS) ─── */}
      {hasAnyCompleted && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem'
          }}
        >
          {/* Top Result Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1.5px solid rgba(29,30,34,0.1)', paddingBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Risk Level Badge */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: analysisData.scoreBg,
                  border: `2px solid ${analysisData.scoreColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 3px 0px #1D1E22',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: analysisData.scoreColor, lineHeight: 1 }}>
                  {analysisData.riskScore}
                </span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  / 100 {isHi ? 'जोखिम' : 'RISK'}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      background: analysisData.scoreBg,
                      color: analysisData.scoreColor,
                      border: `1.2px solid ${analysisData.scoreColor}`,
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Shield size={14} />
                    <span>{isHi ? 'जोखिम स्तर:' : 'Risk Level:'} {analysisData.riskLevel}</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    ({completedCount} {isHi ? 'में से 6 जांच पूर्ण' : 'of 6 checks completed'})
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {isHi ? 'समेकित परियोजना मूल्यांकन' : 'Consolidated Project Assessment'}
                </h3>
              </div>
            </div>

            {/* Action: Download Simple Report */}
            <button
              type="button"
              onClick={handleDownloadSimpleReport}
              className="btn-outline-dark"
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>{isHi ? 'रिपोर्ट डाउनलोड करें' : 'Download Report'}</span>
            </button>
          </div>

          {/* Metric Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              background: '#FAF8F3',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(29,30,34,0.12)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>
                {isHi ? 'कुल जांच' : 'CHECKS PERFORMED'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D1E22', marginTop: '0.15rem' }}>
                {completedCount} {isHi ? 'मॉडल' : 'Models'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9534F' }}>
                {isHi ? 'गंभीर समस्याएं' : 'CRITICAL PROBLEMS'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#D9534F', marginTop: '0.15rem' }}>{analysisData.criticalCount}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#E5B842' }}>
                {isHi ? 'पहचानी गई चेतावनियां' : 'WARNINGS DETECTED'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#E5B842', marginTop: '0.15rem' }}>{analysisData.warningCount}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E7E34' }}>
                {isHi ? 'सत्यापित एवं सुरक्षित' : 'VERIFIED & SAFE'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E7E34', marginTop: '0.15rem' }}>{analysisData.verifiedList.length}</div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.4rem 0' }}>
              {isHi ? 'कार्यकारी सारांश' : 'EXECUTIVE SUMMARY'}
            </h4>
            <p style={{ fontSize: '0.94rem', color: '#1D1E22', lineHeight: 1.55, margin: 0, background: '#FAF8F3', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29,30,34,0.1)' }}>
              {analysisData.summaryText}
            </p>
          </div>

          {/* Section 2: Problems Found in This Project (Prominent) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#D9534F" />
              <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? `इस परियोजना में पाई गई समस्याएं (${analysisData.problemsList.length})` : `Problems Found in This Project (${analysisData.problemsList.length})`}
              </h4>
            </div>

            {analysisData.problemsList.length === 0 ? (
              <div style={{ background: '#E8F5E9', border: '1px solid #1E7E34', borderRadius: 'var(--radius-sm)', padding: '1rem', color: '#1E7E34', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{isHi ? 'कोई समस्या या विसंगति नहीं मिली। सभी जांची गई स्थितियां सामान्य हैं।' : 'No problems or anomalies detected. All checked parameters are normal.'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {analysisData.problemsList.map((prob, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: prob.severityRaw === 'Critical' ? '#FFEBEE' : '#FFF8E1',
                      border: `1.5px solid ${prob.severityRaw === 'Critical' ? '#D9534F' : '#E5B842'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: prob.severityRaw === 'Critical' ? '#D9534F' : '#B8860B' }}>
                        {isHi ? 'द्वारा पहचानी गई:' : 'Detected by:'} {prob.modelName}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
                        background: '#FFFFFF',
                        color: prob.severityRaw === 'Critical' ? '#D9534F' : '#B8860B',
                        border: `1px solid ${prob.severityRaw === 'Critical' ? '#D9534F' : '#E5B842'}`
                      }}>
                        {isHi ? 'गंभीरता:' : 'Severity:'} {prob.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.35rem' }}>
                      {prob.finding}
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#4A4D55', lineHeight: 1.45, marginBottom: '0.5rem' }}>
                      <strong>{isHi ? 'यह समस्या क्यों है:' : 'Why it is a problem:'}</strong> {prob.why}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.6)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(29,30,34,0.15)' }}>
                      <strong>{isHi ? 'साक्ष्य / डेटा:' : 'Evidence / Data:'}</strong> {prob.evidence}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Verified & Normal Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <CheckCircle2 size={18} color="#1E7E34" />
              <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? `सत्यापित एवं सामान्य जांच (${analysisData.verifiedList.length})` : `Verified / Normal Checks (${analysisData.verifiedList.length})`}
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {analysisData.verifiedList.map((ver, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FAF8F3',
                    border: '1px solid rgba(29,30,34,0.12)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={16} color="#1E7E34" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2458' }}>{ver.modelName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#2A2C32', marginTop: '0.1rem' }}>{ver.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Recommended Actions */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem 0' }}>
              {isHi ? 'सिफारिशित कार्रवाइयां' : 'RECOMMENDED ACTIONS'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {analysisData.problemsList.length === 0 ? (
                <div style={{ fontSize: '0.86rem', color: '#1E7E34', background: '#FAF8F3', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29,30,34,0.12)' }}>
                  {isHi ? '✓ किसी सुधारात्मक कार्रवाई की आवश्यकता नहीं है। परियोजना मानक एमपीलैड्स अनुपालन मानदंडों को पूरा करती है।' : '✓ No corrective action required. Project meets standard MPLADS compliance criteria.'}
                </div>
              ) : (
                analysisData.problemsList.map((prob, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FAF8F3',
                      border: '1px solid #1D1E22',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.86rem',
                      color: '#1D1E22'
                    }}
                  >
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0A2458', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800, flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <div>
                      <strong>{prob.action}</strong>
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginLeft: '0.35rem' }}>
                        ({isHi ? 'के लिए:' : 'For:'} {prob.modelName})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. INDIVIDUAL MODEL ANALYSIS SECTION ─── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'व्यक्तिगत मॉडल विश्लेषण' : 'Individual Model Analysis'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '0.15rem 0 0 0' }}>
              {isHi ? 'पूर्ण सुइट चलाए बिना किसी भी विशिष्ट एआई जांच को स्वतंत्र रूप से चलाएं' : 'Run any specific AI check independently without running the full suite'}
            </p>
          </div>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-full)', color: '#0A2458' }}>
            {completedCount} {isHi ? 'में से 6 मॉडल विश्लेषित' : 'of 6 Models Analyzed'}
          </span>
        </div>

        {/* 6 Individual Cards Grid (Strict 3-Column Desktop Layout: 3 cards in Row 1, 3 in Row 2) */}
        <div className="unified-models-grid">
          {modelsList.map((mod) => {
            const Icon = mod.icon;
            const state = modelsState[mod.id];
            const isRunning = state.status === 'running';
            const isCompleted = state.status === 'completed';
            const modelFinding = analysisData[mod.id];

            const statusText = isRunning
              ? (isHi ? 'विश्लेषण जारी...' : 'Analyzing...')
              : isCompleted
              ? (modelFinding.isProblem ? (isHi ? `${modelFinding.severity} समस्या` : `${modelFinding.severity} Issue`) : (isHi ? 'सत्यापित एवं सुरक्षित' : 'Verified Clean'))
              : (isHi ? 'निष्क्रिय / तैयार' : 'Idle / Ready');

            const statusBg = isRunning ? '#E8F0FE' : isCompleted ? (modelFinding.isProblem ? '#FFEBEE' : '#E8F5E9') : '#FAF8F3';
            const statusColor = isRunning ? '#1A73E8' : isCompleted ? (modelFinding.isProblem ? '#D9534F' : '#1E7E34') : 'var(--color-text-muted)';

            return (
              <div
                key={mod.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '2.5px 3.5px 0px #1D1E22',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  height: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: isRunning ? '#0A2458' : '#FAF8F3',
                          border: '1.2px solid #1D1E22',
                          color: isRunning ? '#FFFFFF' : '#0A2458',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={18} className={isRunning ? 'animate-pulse' : ''} />
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1D1E22' }}>
                        {mod.title}
                      </h4>
                    </div>

                    {/* Status Tag */}
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: statusBg,
                        color: statusColor,
                        border: `1.2px solid ${statusColor}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        flexShrink: 0
                      }}
                    >
                      {isCompleted && (modelFinding.isProblem ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />)}
                      {isRunning && <RefreshCw size={11} className="animate-spin" />}
                      <span>{statusText}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                    {mod.description}
                  </p>

                  {/* Finding Box after execution */}
                  {isCompleted && (
                    <div
                      style={{
                        background: modelFinding.isProblem ? '#FFF8E1' : '#E8F5E9',
                        border: `1px solid ${modelFinding.isProblem ? '#E5B842' : '#1E7E34'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 0.85rem',
                        fontSize: '0.8rem',
                        color: '#1D1E22',
                        lineHeight: 1.4
                      }}
                    >
                      <strong>{isHi ? 'परिणाम: ' : 'Result: '}</strong>
                      <span>{modelFinding.finding}</span>
                    </div>
                  )}
                </div>

                {/* Individual Run Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(29,30,34,0.08)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => runSingleModel(mod.id)}
                    disabled={isRunning || isUnifiedRunning}
                    style={{
                      background: '#FAF8F3',
                      border: '1.2px solid #1D1E22',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#0A2458',
                      cursor: (isRunning || isUnifiedRunning) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>{isHi ? 'विश्लेषण जारी...' : 'Running...'}</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <RefreshCw size={12} />
                        <span>{isHi ? 'पुनः जांच करें' : 'Re-run Check'}</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} fill="currentColor" />
                        <span>{isHi ? 'विश्लेषण चलाएं' : 'Run Analysis'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default UnifiedAiIntelligenceView;
