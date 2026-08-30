import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, CheckCircle2, CheckCircle, Clock, AlertTriangle, ChevronDown, 
  MapPin, Building2, Calendar, FileText, CheckSquare, 
  Layers, ArrowRight, DollarSign, Activity, X, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';

// Default enriched projects dataset for timeline exploration
const TIMELINE_PROJECTS_POOL = [
  {
    id: 'MPLADS-2026-8871',
    title: 'Solar High-Mast LED Lighting Installation at 14 Village Intersections',
    category: 'Renewable Energy',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    mp: 'Smt. Darshana Singh',
    constituency: 'Varanasi Lok Sabha',
    sanctionedCost: '₹32,00,000',
    sanctionedCostNum: 3200000,
    expenditure: '₹22,40,000',
    expenditureNum: 2240000,
    expenditurePct: 70,
    physicalProgress: 68,
    status: 'Ongoing',
    statusLabel: 'In Progress (On Track)',
    statusLabelHi: 'प्रगति पर (समय पर)',
    agency: 'Varanasi Smart Solar Power Ltd',
    sanctionDate: '02 Mar 2024',
    targetDate: '30 Oct 2024',
    delayMonths: 0,
    isDelayed: false,
    milestones: [
      {
        step: 1,
        title: 'Project Recommended by MP',
        titleHi: 'सांसद द्वारा अनुशंसित परियोजना',
        date: '15 Jan 2024',
        desc: 'Formal letter of recommendation submitted by Smt. Darshana Singh to District Magistrate.',
        descHi: 'श्रीमती दर्शना सिंह द्वारा जिलाधिकारी को औपचारिक अनुशंसा पत्र सौंपा गया।',
        status: 'Completed'
      },
      {
        step: 2,
        title: 'Administrative Approval & Sanction',
        titleHi: 'प्रशासनिक स्वीकृति एवं संस्तुति',
        date: '02 Mar 2024',
        desc: 'District Planning Committee verified feasibility and granted formal administrative approval.',
        descHi: 'जिला योजना समिति ने व्यवहार्यता का सत्यापन कर औपचारिक प्रशासनिक स्वीकृति प्रदान की।',
        status: 'Completed'
      },
      {
        step: 3,
        title: 'First Fund Release (Installment 1)',
        titleHi: 'प्रथम निधि जारी (किस्त 1)',
        date: '20 Mar 2024',
        desc: 'Initial installment of ₹16,00,000 (50%) disbursed to Varanasi Smart Solar Power Ltd.',
        descHi: 'वाराणसी स्मार्ट सोलर पावर लिमिटेड को ₹16,00,000 (50%) की पहली किस्त जारी की गई।',
        status: 'Completed'
      },
      {
        step: 4,
        title: 'Groundwork & Mast Foundations Erected',
        titleHi: 'नींव निर्माण एवं पोल अधिष्ठापन कार्य',
        date: '10 Jun 2024',
        desc: 'Civil foundation works completed at all 14 designated road junctions.',
        descHi: 'सभी 14 चिन्हित चौराहों पर सिविल नींव का कार्य पूर्ण हुआ।',
        status: 'Completed'
      },
      {
        step: 5,
        title: 'Solar Panel & Battery Installation (Phase 2)',
        titleHi: 'सोलर पैनल एवं बैटरी संस्थापन (चरण 2)',
        date: '18 Aug 2024',
        desc: 'Installation of high-efficiency photovoltaic panels and lithium storage units in progress.',
        descHi: 'उच्च क्षमता वाले फोटोवोल्टिक पैनल एवं लिथियम भंडारण संस्थापन प्रगति पर है।',
        status: 'Current'
      },
      {
        step: 6,
        title: 'Physical Field Inspection & Geo-Tagging',
        titleHi: 'भौतिक क्षेत्र सत्यापन एवं जियो-टैगिंग',
        date: '15 Oct 2024',
        desc: 'Field verification officer to capture geo-tagged inspection photos via MoSPI mobile app.',
        descHi: 'क्षेत्र निरीक्षण अधिकारी द्वारा मोबाइल ऐप के माध्यम से जियो-टैग्ड तस्वीरें दर्ज की जाएंगी।',
        status: 'Pending'
      },
      {
        step: 7,
        title: 'Final Handover & Utilization Certificate (UC)',
        titleHi: 'अंतिम हस्तांतरण एवं उपयोगिता प्रमाण पत्र',
        date: '30 Oct 2024',
        desc: 'Submission of audited accounts, contractor sign-off, and formal commissioning.',
        descHi: 'लेखा परीक्षा, ठेकेदार अनापत्ति और औपचारिक उद्घाटन के साथ कार्य पूर्णता।',
        status: 'Pending'
      }
    ]
  },
  {
    id: 'MPLADS-2026-7734',
    title: 'Upgradation of District Primary Health Center Ward 7 & Diagnostic Lab',
    category: 'Healthcare Infrastructure',
    state: 'Nagaland',
    district: 'Kohima',
    mp: 'Smt. S. Phangnon Konyak',
    constituency: 'Sitting Rajya Sabha, Nagaland',
    sanctionedCost: '₹75,00,000',
    sanctionedCostNum: 7500000,
    expenditure: '₹67,50,000',
    expenditureNum: 6750000,
    expenditurePct: 90,
    physicalProgress: 52,
    status: 'Delayed',
    statusLabel: 'Delayed (Review Needed)',
    statusLabelHi: 'विलंबित (समीक्षा आवश्यक)',
    agency: 'Eastern Hill Construction Corp',
    sanctionDate: '10 Feb 2024',
    targetDate: '20 Sep 2024',
    delayMonths: 4,
    isDelayed: true,
    delayReason: 'Delay of 4 months due to monsoon transit bottlenecks and equipment procurement backlog.',
    delayReasonHi: 'मानसून के दौरान परिवहन बाधाओं और नैदानिक उपकरण खरीद में 4 माह का विलंब।',
    milestones: [
      {
        step: 1,
        title: 'MP Recommendation Submitted',
        titleHi: 'सांसद अनुशंसा प्रस्तुत',
        date: '12 Dec 2023',
        desc: 'Detailed recommendation submitted for upgrading Kohima Ward 7 primary health facilities.',
        descHi: 'कोहिमा वार्ड 7 प्राथमिक स्वास्थ्य सुविधाओं के उन्नयन हेतु विस्तृत अनुशंसा पत्र।',
        status: 'Completed'
      },
      {
        step: 2,
        title: 'Technical Sanction & Detailed Project Report (DPR)',
        titleHi: 'तकनीकी स्वीकृति एवं डीपीआर अनुमोदन',
        date: '10 Feb 2024',
        desc: 'State Health Engineering division approved hospital layout and technical drawings.',
        descHi: 'राज्य स्वास्थ्य अभियांत्रिकी प्रभाग द्वारा अस्पताल लेआउट एवं तकनीकी ड्राइंग स्वीकृत।',
        status: 'Completed'
      },
      {
        step: 3,
        title: 'Contract Award & Advance Fund Release',
        titleHi: 'ठेका आवंटन एवं अग्रिम निधि जारी',
        date: '25 Feb 2024',
        desc: 'Work awarded to Eastern Hill Construction Corp; ₹37,50,000 released.',
        descHi: 'ईस्टर्न हिल कंस्ट्रक्शन को कार्य आवंटित; ₹37,50,000 की अग्रिम राशि जारी।',
        status: 'Completed'
      },
      {
        step: 4,
        title: 'Diagnostic Lab Civil Works & Structural Alteration',
        titleHi: 'नैदानिक प्रयोगशाला सिविल कार्य',
        date: '15 May 2024',
        desc: 'Civil foundation and room partitions completed up to beam level.',
        descHi: 'सिविल नींव एवं कक्ष विभाजन का कार्य बीम स्तर तक पूर्ण।',
        status: 'Completed'
      },
      {
        step: 5,
        title: 'Equipment Installation & Interior Electrification',
        titleHi: 'उपकरण संस्थापन एवं विद्युतीकरण',
        date: '20 Jul 2024',
        desc: 'Medical equipment delivery delayed; contractor issued formal notice for expedited delivery.',
        descHi: 'चिकित्सा उपकरण आपूर्ति में देरी; ठेकेदार को त्वरित आपूर्ति हेतु नोटिस जारी।',
        status: 'Delayed'
      },
      {
        step: 6,
        title: 'Chief Medical Officer Inspection & Safety Audit',
        titleHi: 'मुख्य चिकित्सा अधिकारी निरीक्षण एवं सुरक्षा ऑडिट',
        date: '10 Nov 2024',
        desc: 'Final safety inspection and diagnostic laboratory equipment calibration.',
        descHi: 'अंतिम सुरक्षा निरीक्षण और प्रयोगशाला उपकरण अंशांकन।',
        status: 'Pending'
      },
      {
        step: 7,
        title: 'Final Handover to Health Department',
        titleHi: 'स्वास्थ्य विभाग को अंतिम हस्तांतरण',
        date: '15 Dec 2024',
        desc: 'Formal commissioning and public service dedication.',
        descHi: 'औपचारिक उद्घाटन और सार्वजनिक स्वास्थ्य सेवा में समर्पण।',
        status: 'Pending'
      }
    ]
  },
  {
    id: 'MPLADS-2026-4412',
    title: 'Smart Digital Classrooms & STEM Laboratory Equipment in 12 Govt Schools',
    category: 'Education & Schools',
    state: 'Rajasthan',
    district: 'Jaipur',
    mp: 'Col. Rajyavardhan Singh Rathore',
    constituency: 'Jaipur Rural Lok Sabha',
    sanctionedCost: '₹28,00,000',
    sanctionedCostNum: 2800000,
    expenditure: '₹28,00,000',
    expenditureNum: 2800000,
    expenditurePct: 100,
    physicalProgress: 100,
    status: 'Completed',
    statusLabel: 'Completed & Verified',
    statusLabelHi: 'पूर्ण एवं सत्यापित',
    agency: 'Jaipur EdTech Solutions Ltd',
    sanctionDate: '05 Jan 2024',
    targetDate: '30 May 2024',
    delayMonths: 0,
    isDelayed: false,
    milestones: [
      {
        step: 1,
        title: 'MP Recommendation Issued',
        titleHi: 'सांसद अनुशंसा जारी',
        date: '10 Nov 2023',
        desc: 'Digital smart school education initiative proposed for rural Jaipur govt schools.',
        descHi: 'जयपुर ग्रामीण सरकारी स्कूलों के लिए डिजिटल स्मार्ट स्कूल शिक्षा पहल प्रस्तावित।',
        status: 'Completed'
      },
      {
        step: 2,
        title: 'District Authority Sanction Order',
        titleHi: 'जिला प्राधिकरण स्वीकृति आदेश',
        date: '05 Jan 2024',
        desc: 'Sanction order issued under IT & Education infrastructure sub-head.',
        descHi: 'आईटी एवं शिक्षा अवसंरचना उप-शीर्ष के तहत स्वीकृति आदेश जारी।',
        status: 'Completed'
      },
      {
        step: 3,
        title: 'Hardware Procurement & Delivery',
        titleHi: 'हार्डवेयर खरीद एवं स्कूलों में आपूर्ति',
        date: '15 Feb 2024',
        desc: 'Smart interactive displays, projectors, and UPS delivered to all 12 schools.',
        descHi: 'सभी 12 स्कूलों में स्मार्ट इंटरैक्टिव डिस्प्ले, प्रोजेक्टर और यूपीएस की आपूर्ति।',
        status: 'Completed'
      },
      {
        step: 4,
        title: 'STEM Lab Setup & Software Configuration',
        titleHi: 'स्टेम लैब सेटअप एवं सॉफ्टवेयर संस्थापन',
        date: '10 Apr 2024',
        desc: 'Curriculum-aligned science kits installed and teacher orientation completed.',
        descHi: 'पाठ्यक्रम-संरेखित विज्ञान किट संस्थापित और शिक्षक प्रशिक्षण पूर्ण।',
        status: 'Completed'
      },
      {
        step: 5,
        title: 'Field Verification & Headmaster Verification',
        titleHi: 'क्षेत्र सत्यापन एवं प्रधानाध्यापक प्रमाणन',
        date: '15 May 2024',
        desc: 'Physical verification report signed with photographic proof from all 12 institutions.',
        descHi: 'सभी 12 संस्थानों के फोटोग्राफिक साक्ष्य के साथ भौतिक सत्यापन रिपोर्ट सत्यापित।',
        status: 'Completed'
      },
      {
        step: 6,
        title: 'Final UC Certified & Project Closed',
        titleHi: 'अंतिम उपयोगिता प्रमाण पत्र एवं कार्य समापन',
        date: '30 May 2024',
        desc: '100% financial utilization certificate submitted and uploaded to MoSPI portal.',
        descHi: '100% वित्तीय उपयोगिता प्रमाण पत्र प्रस्तुत एवं पोर्टल पर अपलोड।',
        status: 'Completed'
      }
    ]
  },
  {
    id: 'MPLADS-2026-6190',
    title: 'Construction of Overbridge Approach Road & Culverts at NH-30',
    category: 'Transport & Roads',
    state: 'Bihar',
    district: 'Patna',
    mp: 'Shri Ravi Shankar Prasad',
    constituency: 'Patna Sahib Lok Sabha',
    sanctionedCost: '₹1,20,00,000',
    sanctionedCostNum: 12000000,
    expenditure: '₹1,18,00,000',
    expenditureNum: 11800000,
    expenditurePct: 98,
    physicalProgress: 35,
    status: 'Delayed',
    statusLabel: 'Severely Delayed',
    statusLabelHi: 'अत्यधिक विलंबित',
    agency: 'Ganga Valley Infrastructure JV',
    sanctionDate: '20 Nov 2023',
    targetDate: '15 Jul 2024',
    delayMonths: 8,
    isDelayed: true,
    delayReason: 'Delay of 8 months caused by land acquisition disputes and drainage realignment approvals.',
    delayReasonHi: 'भूमि अधिग्रहण विवाद एवं जल निकासी पुनः-संरेखण अनुमोदन के कारण 8 माह का विलंब।',
    milestones: [
      {
        step: 1,
        title: 'Project Recommended by MP',
        titleHi: 'सांसद द्वारा अनुशंसित',
        date: '10 Aug 2023',
        desc: 'Traffic de-bottlenecking road connectivity proposal approved by Member of Parliament.',
        descHi: 'ट्रैफिक जाम निवारण हेतु सड़क संपर्क प्रस्ताव सांसद द्वारा अनुमोदित।',
        status: 'Completed'
      },
      {
        step: 2,
        title: 'Administrative Approval & Budget Allocation',
        titleHi: 'प्रशासनिक स्वीकृति एवं बजट आवंटन',
        date: '20 Nov 2023',
        desc: 'District Collector sanction issued with PWD as the state engineering executive agency.',
        descHi: 'पीडब्ल्यूडी को निष्पादन एजेंसी बनाते हुए जिलाधिकारी द्वारा स्वीकृति जारी।',
        status: 'Completed'
      },
      {
        step: 3,
        title: 'Mobilization & Initial Excavation',
        titleHi: 'संसाधन जुटाव एवं प्रारंभिक खुदाई',
        date: '15 Jan 2024',
        desc: 'Excavation of side drains and leveling completed.',
        descHi: 'साइड नालियों की खुदाई और समतलीकरण का कार्य पूर्ण।',
        status: 'Completed'
      },
      {
        step: 4,
        title: 'Culvert Box Structure Construction',
        titleHi: 'पुलिया बॉक्स संरचना निर्माण',
        date: '15 Apr 2024',
        desc: 'Substructure works halted due to right-of-way easement litigation.',
        descHi: 'मार्ग के अधिकार को लेकर विवाद के कारण अधोसंरचना कार्य बाधित।',
        status: 'Delayed'
      },
      {
        step: 5,
        title: 'Bituminous Paving & Road Surface Laying',
        titleHi: 'डामरीकरण एवं सड़क सतह निर्माण',
        date: '15 Dec 2024',
        desc: 'Awaiting resolution of culvert junction before blacktop paving commences.',
        descHi: 'पुलिया निर्माण पूर्ण होने के उपरांत डामरीकरण कार्य प्रारंभ किया जाएगा।',
        status: 'Pending'
      },
      {
        step: 6,
        title: 'Safety Signage, Street Lights & Commissioning',
        titleHi: 'सुरक्षा संकेतक, स्ट्रीट लाइट एवं लोकार्पण',
        date: '30 Jan 2025',
        desc: 'Final inspection, safety audit, and formal opening for public vehicles.',
        descHi: 'अंतिम निरीक्षण, सुरक्षा ऑडिट और सार्वजनिक यातायात हेतु औपचारिक उद्घाटन।',
        status: 'Pending'
      }
    ]
  },
  {
    id: 'MPLADS-2026-3398',
    title: 'Deep Borewell, Overhead Reservoir & Piped Drinking Water Supply',
    category: 'Drinking Water',
    state: 'Madhya Pradesh',
    district: 'Indore',
    mp: 'Shri Shankar Lalwani',
    constituency: 'Indore Lok Sabha',
    sanctionedCost: '₹45,00,000',
    sanctionedCostNum: 4500000,
    expenditure: '₹45,00,000',
    expenditureNum: 4500000,
    expenditurePct: 100,
    physicalProgress: 100,
    status: 'Completed',
    statusLabel: 'Completed & Verified',
    statusLabelHi: 'पूर्ण एवं सत्यापित',
    agency: 'Indore Municipal Water Works',
    sanctionDate: '12 Dec 2023',
    targetDate: '15 Apr 2024',
    delayMonths: 0,
    isDelayed: false,
    milestones: [
      {
        step: 1,
        title: 'Project Recommended',
        titleHi: 'परियोजना अनुशंसित',
        date: '15 Oct 2023',
        desc: 'MP recommendation submitted to resolve clean water shortage.',
        descHi: 'स्वच्छ जल की कमी को दूर करने हेतु सांसद अनुशंसा पत्र प्रस्तुत।',
        status: 'Completed'
      },
      {
        step: 2,
        title: 'Hydro-Geological Survey & Sanction',
        titleHi: 'भूजल सर्वेक्षण एवं स्वीकृति',
        date: '12 Dec 2023',
        desc: 'Groundwater yield test passed; formal sanction order released.',
        descHi: 'भूजल स्तर परीक्षण सफल; औपचारिक स्वीकृति आदेश जारी।',
        status: 'Completed'
      },
      {
        step: 3,
        title: 'Deep Borewell Drilling & Pump Installation',
        titleHi: 'गहरे बोरवेल की ड्रिलिंग एवं पंप संस्थापन',
        date: '20 Jan 2024',
        desc: '600ft deep bore drilled and submersible pump fitted.',
        descHi: '600 फीट गहरा बोरवेल और सबमर्सिबल पंप सफलतापूर्वक संस्थापित।',
        status: 'Completed'
      },
      {
        step: 4,
        title: '50,000L Overhead Tank Construction',
        titleHi: '50,000 लीटर ओवरहेड टैंक निर्माण',
        date: '28 Feb 2024',
        desc: 'RCC storage reservoir structure erected and pressure tested.',
        descHi: 'आरसीसी ओवरहेड जलाशय संरचना निर्मित और दबाव परीक्षण सफल।',
        status: 'Completed'
      },
      {
        step: 5,
        title: 'Pipeline Distribution Network to Households',
        titleHi: 'घरों तक पाइपलाइन वितरण नेटवर्क',
        date: '25 Mar 2024',
        desc: '4.2km HDPE piping laid across 350 residential units.',
        descHi: '350 आवासीय इकाइयों में 4.2 किमी एचडीपीई पाइपलाइन बिछाई गई।',
        status: 'Completed'
      },
      {
        step: 6,
        title: 'Water Quality Testing & Final Verification',
        titleHi: 'जल गुणवत्ता परीक्षण एवं अंतिम सत्यापन',
        date: '15 Apr 2024',
        desc: 'Potable water quality certificate issued and project handed to Panchayat.',
        descHi: 'पेयजल गुणवत्ता प्रमाण पत्र जारी और पंचायत को हस्तांतरित।',
        status: 'Completed'
      }
    ]
  }
];

const ProjectTimelineView = () => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [projectPool, setProjectPool] = useState(TIMELINE_PROJECTS_POOL);
  const [selectedProject, setSelectedProject] = useState(TIMELINE_PROJECTS_POOL[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch and enrich real projects into the project selector pool if available
  useEffect(() => {
    fetch('/data/real_projects.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formattedReal = data.slice(0, 40).map((p, idx) => {
            const isComp = p.type === 'completed' || p.status?.toLowerCase().includes('completed');
            const costNum = typeof p.cost === 'number' ? p.cost : 2000000;
            const expNum = typeof p.disbursed === 'number' ? p.disbursed : (isComp ? costNum : Math.round(costNum * 0.7));
            const expPct = Math.min(100, Math.round((expNum / (costNum || 1)) * 100));
            const physProg = isComp ? 100 : (idx % 3 === 0 ? 45 : idx % 3 === 1 ? 80 : 0);
            const isDelayed = !isComp && expPct > physProg + 20;

            const baseDate = p.date || '2024';

            return {
              id: p.id || `MPLADS-${202600 + idx}`,
              title: p.title || 'Community Development Work',
              category: p.category || 'Infrastructure',
              state: p.state || 'National',
              district: p.district || p.constituency || 'District Area',
              mp: p.mp || 'Member of Parliament',
              constituency: p.constituency ? `${p.constituency} Lok Sabha` : 'Constituency',
              sanctionedCost: `₹${costNum.toLocaleString('en-IN')}`,
              sanctionedCostNum: costNum,
              expenditure: `₹${expNum.toLocaleString('en-IN')}`,
              expenditureNum: expNum,
              expenditurePct: expPct,
              physicalProgress: physProg,
              status: isComp ? 'Completed' : (isDelayed ? 'Delayed' : 'Ongoing'),
              statusLabel: isComp ? 'Completed & Verified' : (isDelayed ? 'Delayed / Review Needed' : 'In Progress (On Track)'),
              statusLabelHi: isComp ? 'पूर्ण एवं सत्यापित' : (isDelayed ? 'विलंबित / समीक्षा आवश्यक' : 'प्रगति पर (समय पर)'),
              agency: p.agency || 'District Rural Development Authority',
              sanctionDate: baseDate,
              targetDate: isComp ? baseDate : 'Late 2024',
              delayMonths: isDelayed ? 5 : 0,
              isDelayed,
              delayReason: isDelayed ? 'Execution milestones overdue relative to financial disbursement.' : null,
              delayReasonHi: isDelayed ? 'वित्तीय संवितरण की तुलना में कार्य निष्पादन में विलंब दर्ज।' : null,
              milestones: [
                {
                  step: 1,
                  title: 'Project Recommended by MP',
                  titleHi: 'सांसद द्वारा अनुशंसित',
                  date: baseDate,
                  desc: 'Recommendation submitted to District Authority under MPLADS guidelines.',
                  descHi: 'एमपीलैड्स दिशानिर्देशों के तहत जिला प्राधिकरण को अनुशंसा प्रस्तुत।',
                  status: 'Completed'
                },
                {
                  step: 2,
                  title: 'Administrative Sanction & Fund Allotment',
                  titleHi: 'प्रशासनिक स्वीकृति एवं निधि आवंटन',
                  date: baseDate,
                  desc: 'Feasibility checked and formal sanction granted.',
                  descHi: 'व्यवहार्यता सत्यापन उपरांत औपचारिक स्वीकृति आदेश जारी।',
                  status: 'Completed'
                },
                {
                  step: 3,
                  title: 'Work Commencement & Foundation',
                  titleHi: 'कार्य प्रारंभ एवं नींव निर्माण',
                  date: baseDate,
                  desc: 'Groundwork and initial execution phase initiated.',
                  descHi: 'प्रारंभिक निष्पादन और सिविल कार्य प्रारंभ।',
                  status: physProg > 30 ? 'Completed' : (physProg > 0 ? 'Current' : 'Pending')
                },
                {
                  step: 4,
                  title: 'Intermediate Milestone Inspection',
                  titleHi: 'मध्यवर्ती मील का पत्थर एवं निरीक्षण',
                  date: baseDate,
                  desc: 'Mid-term progress appraisal by district engineers.',
                  descHi: 'जिला अभियंताओं द्वारा मध्यवर्ती प्रगति मूल्यांकन।',
                  status: isDelayed ? 'Delayed' : (physProg > 60 ? 'Completed' : (physProg > 30 ? 'Current' : 'Pending'))
                },
                {
                  step: 5,
                  title: 'Physical Verification & Completion Certification',
                  titleHi: 'भौतिक सत्यापन एवं पूर्णता प्रमाण पत्र',
                  date: isComp ? baseDate : 'Pending',
                  desc: 'Final inspection, geotagging, and utilization certificate sign-off.',
                  descHi: 'अंतिम निरीक्षण, जियो-टैगिंग और उपयोगिता प्रमाण पत्र सत्यापन।',
                  status: isComp ? 'Completed' : 'Pending'
                }
              ]
            };
          });

          setProjectPool([...TIMELINE_PROJECTS_POOL, ...formattedReal]);
        }
      })
      .catch(() => {
        // Fallback to default pool
      });
  }, []);

  // Filter project selector list
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projectPool;
    return projectPool.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.mp.toLowerCase().includes(q) ||
      p.constituency.toLowerCase().includes(q)
    );
  }, [projectPool, searchQuery]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* ─── 1. PAGE INTRODUCTION ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.1rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
            {isHi ? 'परियोजना समयरेखा' : 'Project Timeline'}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
            {isHi
              ? 'परियोजना जीवनचक्र में प्रमुख मील के पत्थर और कार्यान्वयन प्रगति को ट्रैक करें।'
              : 'Track key milestones and implementation progress across the project lifecycle.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.3rem 0.85rem',
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-full)',
            boxShadow: '1.5px 2px 0px #1D1E22',
            color: '#0A2458'
          }}>
            {isHi ? 'मील का पत्थर ट्रैकिंग सक्रिय' : 'Live Milestone Tracking'}
          </span>
        </div>
      </div>

      {/* ─── 2. PROMINENT PROJECT SELECTOR ─── */}
      <div style={{ position: 'relative', width: '100%', zIndex: 30 }}>
        <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.15rem 1.35rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isHi ? 'परियोजना चुनें या खोजें:' : 'Select or Search Project to View Timeline:'}
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {isHi ? 'आईडी, शीर्षक, जिला या सांसद के नाम से खोजें' : 'Search by ID, title, district, or MP'}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1D1E22',
                zIndex: 2
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder={
                selectedProject 
                  ? `${selectedProject.id} — ${selectedProject.title}` 
                  : (isHi ? 'परियोजना खोजें या सूची से चुनें...' : 'Search or select a project...')
              }
              style={{
                width: '100%',
                padding: '0.75rem 2.5rem 0.75rem 2.85rem',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1D1E22',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                color: '#1D1E22'
              }}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Autocomplete / Dropdown List */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '4px 6px 0px #1D1E22',
                maxHeight: '320px',
                overflowY: 'auto',
                zIndex: 100
              }}
            >
              <div style={{ padding: '0.65rem 1rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', fontSize: '0.75rem', fontWeight: 800, color: '#0A2458', display: 'flex', justifyContent: 'space-between' }}>
                <span>{isHi ? 'उपलब्ध एमपीलैड्स परियोजनाएं' : 'Available MPLADS Projects'} ({filteredProjects.length})</span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1D1E22', fontWeight: 700 }}
                >
                  ✕ {isHi ? 'बंद करें' : 'Close'}
                </button>
              </div>

              {filteredProjects.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>
                  {isHi ? 'कोई मेल खाती परियोजना नहीं मिली' : 'No matching projects found.'}
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const isSelected = selectedProject && selectedProject.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProject(p)}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid #F0F0F0',
                        cursor: 'pointer',
                        background: isSelected ? '#FAF8F3' : '#FFFFFF',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#FDFCF9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#0A2458' }}>
                          {p.id}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: p.status === 'Completed' ? '#F0FDF4' : p.status === 'Delayed' ? '#FEF2F2' : '#E8F5E9',
                          color: p.status === 'Completed' ? '#1E7E34' : p.status === 'Delayed' ? '#D9534F' : '#0A2458',
                          border: `1px solid ${p.status === 'Completed' ? '#1E7E34' : p.status === 'Delayed' ? '#D9534F' : '#52B79A'}`
                        }}>
                          {p.status} ({p.physicalProgress}%)
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1D1E22', marginBottom: '0.2rem' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {p.mp} • {p.district}, {p.state} • Sanctioned: {p.sanctionedCost}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. SELECTED PROJECT SUMMARY CARD ─── */}
      {selectedProject ? (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem 1.75rem', boxShadow: '3px 4px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#0A2458', background: '#FAF8F3', padding: '0.2rem 0.6rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                  {selectedProject.id}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {selectedProject.category}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.4rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.3 }}>
                {selectedProject.title}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
                <strong>{selectedProject.mp}</strong> • {selectedProject.constituency} • {selectedProject.district}, {selectedProject.state}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: selectedProject.status === 'Completed' ? '#F0FDF4' : selectedProject.status === 'Delayed' ? '#FEF2F2' : '#E8F5E9',
                color: selectedProject.status === 'Completed' ? '#1E7E34' : selectedProject.status === 'Delayed' ? '#D9534F' : '#0A2458',
                border: `1.5px solid ${selectedProject.status === 'Completed' ? '#1E7E34' : selectedProject.status === 'Delayed' ? '#D9534F' : '#52B79A'}`
              }}>
                {selectedProject.status === 'Completed' ? <CheckCircle2 size={13} strokeWidth={2.5} /> : selectedProject.status === 'Delayed' ? <AlertTriangle size={13} strokeWidth={2.5} /> : <Activity size={13} strokeWidth={2.5} />}
                <span>{isHi ? (selectedProject.statusLabelHi || selectedProject.status) : (selectedProject.statusLabel || selectedProject.status)}</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Agency: <strong>{selectedProject.agency}</strong>
              </span>
            </div>
          </div>

          {/* 4 Summary Mini Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>SANCTIONED COST</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>{selectedProject.sanctionedCost}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Sanction Date: {selectedProject.sanctionDate}</div>
            </div>

            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>EXPENDITURE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A2458', marginTop: '0.2rem' }}>{selectedProject.expenditure}</div>
              <div style={{ fontSize: '0.72rem', color: '#0A2458', fontWeight: 700, marginTop: '0.15rem' }}>{selectedProject.expenditurePct}% Utilization</div>
            </div>

            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>PHYSICAL PROGRESS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedProject.physicalProgress === 100 ? '#1E7E34' : 'var(--color-accent-teal-hover)', marginTop: '0.2rem' }}>
                {selectedProject.physicalProgress}%
              </div>
              <div style={{ width: '100%', height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden', marginTop: '0.35rem' }}>
                <div style={{ width: `${selectedProject.physicalProgress}%`, height: '100%', background: selectedProject.physicalProgress === 100 ? '#1E7E34' : 'var(--color-accent-teal)' }} />
              </div>
            </div>

            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TARGET COMPLETION</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>{selectedProject.targetDate}</div>
              <div style={{ fontSize: '0.72rem', color: selectedProject.isDelayed ? '#D9534F' : '#1E7E34', fontWeight: 700, marginTop: '0.15rem' }}>
                {selectedProject.isDelayed ? (isHi ? 'समयसीमा विलंबित' : 'Overdue Milestone') : (isHi ? 'समय पर संचालित' : 'On Schedule')}
              </div>
            </div>
          </div>

          {/* Delay / On-Schedule Alert Banner */}
          {selectedProject.isDelayed ? (
            <div style={{ background: '#FFF8E1', border: '1.5px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '0.95rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <AlertTriangle size={22} color="#D9534F" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#854D0E', fontSize: '0.9rem' }}>
                  {isHi ? 'परियोजना में विलंब दर्ज किया गया (Delay Detected)' : 'Delay Detected in Project Lifecycle'}
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#4A4D55', lineHeight: 1.4 }}>
                  {isHi
                    ? (selectedProject.delayReasonHi || `${selectedProject.delayMonths} महीने का विलंब। वास्तविक भौतिक प्रगति (${selectedProject.physicalProgress}%) वित्तीय संवितरण (${selectedProject.expenditurePct}%) से पीछे चल रही है।`)
                    : (selectedProject.delayReason || `Overdue by ${selectedProject.delayMonths} months. Physical progress (${selectedProject.physicalProgress}%) is trailing financial disbursement (${selectedProject.expenditurePct}%).`)}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #52B79A', borderRadius: 'var(--radius-md)', padding: '0.95rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <ShieldCheck size={22} color="#1E7E34" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#1E7E34', fontSize: '0.9rem' }}>
                  {isHi ? 'परियोजना समय पर संचालित (On Schedule)' : 'Project Progress is On Schedule'}
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#4A4D55', lineHeight: 1.4 }}>
                  {isHi
                    ? 'सभी कार्यान्वयन चरण निर्धारित सरकारी समयसीमा और तकनीकी मानकों के अनुसार संतोषजनक रूप से आगे बढ़ रहे हैं।'
                    : 'All milestone phases are progressing satisfactorily in compliance with government execution timelines.'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '2.5rem 1.5rem', textAlign: 'center', boxShadow: '3px 4px 0px #1D1E22' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0 }}>
            {isHi ? 'समयरेखा देखने के लिए परियोजना चुनें' : 'Select a Project to View its Timeline'}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
            {isHi ? 'कार्यान्वयन मील के पत्थर और प्रगति का विश्लेषण करने के लिए ऊपर दिए गए सर्च बॉक्स से परियोजना चुनें।' : 'Choose an MPLADS project above to see its implementation milestones and lifecycle progress.'}
          </p>
        </div>
      )}

      {/* ─── 4. VERTICAL MILESTONE TIMELINE ─── */}
      {selectedProject && (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.75rem clamp(1rem, 3vw, 2.25rem)', boxShadow: '3px 4px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.3rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'परियोजना कार्यान्वयन मील के पत्थर' : 'Project Implementation Milestones'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                {isHi ? 'अनुशंसा से लेकर अंतिम समापन तक की चरणबद्ध समयरेखा' : 'Step-by-step lifecycle from recommendation to final verification and handover'}
              </span>
            </div>

            <span style={{ fontSize: '0.76rem', fontWeight: 800, padding: '0.25rem 0.75rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-full)', color: '#0A2458' }}>
              {selectedProject.milestones?.filter(m => m.status === 'Completed').length || 0} / {selectedProject.milestones?.length || 0} {isHi ? 'चरण पूर्ण' : 'Phases Completed'}
            </span>
          </div>

          {/* Timeline Nodes */}
          <div style={{ position: 'relative', paddingLeft: 'clamp(1rem, 2.5vw, 2rem)' }}>
            {/* Vertical Connecting Line */}
            <div
              style={{
                position: 'absolute',
                left: 'clamp(1.75rem, 3.25vw, 2.75rem)',
                top: '20px',
                bottom: '30px',
                width: '3px',
                background: '#1D1E22',
                zIndex: 1
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 2 }}>
              {selectedProject.milestones && selectedProject.milestones.map((ms, idx) => {
                const isCompleted = ms.status === 'Completed';
                const isCurrent = ms.status === 'Current';
                const isDelayed = ms.status === 'Delayed';
                const isPending = ms.status === 'Pending';

                const nodeBg = isCompleted ? '#1E7E34' : isDelayed ? '#D9534F' : isCurrent ? 'var(--color-accent-teal)' : '#FFFFFF';
                const nodeColor = isCompleted || isDelayed ? '#FFFFFF' : '#1D1E22';

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                    {/* Node Circle */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: nodeBg,
                        border: '2px solid #1D1E22',
                        boxShadow: '1.5px 2px 0px #1D1E22',
                        color: nodeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        flexShrink: 0,
                        zIndex: 3
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={18} strokeWidth={2.6} />
                      ) : isDelayed ? (
                        <AlertTriangle size={17} strokeWidth={2.6} />
                      ) : (
                        <span>{ms.step}</span>
                      )}
                    </div>

                    {/* Milestone Card Content */}
                    <div
                      style={{
                        flex: 1,
                        background: isCurrent ? '#FAF8F3' : '#FFFFFF',
                        border: '1.5px solid #1D1E22',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.15rem 1.35rem',
                        boxShadow: isCurrent ? '3px 4px 0px #1D1E22' : '1.5px 2px 0px #1D1E22'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {isHi ? `चरण ${ms.step}` : `PHASE ${ms.step}`}
                          </span>
                          <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.1rem', fontWeight: 800, color: '#1D1E22', margin: '0.15rem 0 0 0' }}>
                            {isHi ? (ms.titleHi || ms.title) : ms.title}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: isCompleted ? '#F0FDF4' : isDelayed ? '#FEF2F2' : isCurrent ? '#E8F5E9' : '#FAF8F3',
                            color: isCompleted ? '#1E7E34' : isDelayed ? '#D9534F' : isCurrent ? '#0A2458' : 'var(--color-text-secondary)',
                            border: `1px solid ${isCompleted ? '#1E7E34' : isDelayed ? '#D9534F' : isCurrent ? '#52B79A' : '#1D1E22'}`
                          }}>
                            {isCompleted && <CheckCircle2 size={11} />}
                            {isDelayed && <AlertTriangle size={11} />}
                            {isCurrent && <Activity size={11} />}
                            {isPending && <Clock size={11} />}
                            <span>{ms.status}</span>
                          </span>

                          <span style={{ fontSize: '0.76rem', color: '#1D1E22', fontWeight: 700, background: '#FAF8F3', border: '1px solid rgba(29,30,34,0.2)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            {ms.date || 'Date not available'}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                        {isHi ? (ms.descHi || ms.desc) : ms.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default ProjectTimelineView;
