/**
 * Tech Dada - Multilingual Dada AI Tutor Module (Engine v3.3)
 * Full support for English, Marathi (मराठी), and Hindi (हिंदी):
 * - User can ask questions in English, Marathi, Hindi, or Hinglish/Marathlish.
 * - Language selector: Auto Detect, English, मराठी, हिंदी.
 * - Deep Offline Academic Knowledge Engine in English, Marathi, and Hindi.
 * - Live Serverless Multilingual AI LLM for any customized question.
 * - Voice Input supporting mr-IN, hi-IN, and en-IN speech recognition.
 */

const AIChatModule = {
  isOpen: false,
  currentLevel: "advanced", // 'basic' | 'advanced'
  currentLanguage: "auto",  // 'auto' | 'en' | 'mr' | 'hi'
  geminiApiKey: localStorage.getItem("techdada_gemini_key") || "",
  chatHistory: [],
  isGenerating: false,
  recognition: null,
  isListening: false,

  init() {
    this.loadHistory();
    this.renderMessages();
    this.setupEventListeners();
    this.setupSpeechRecognition();
  },

  setupEventListeners() {
    const input = document.getElementById("aiChatInput");
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },

  // 1. Toggle AI Chat Widget Visibility
  toggleChat() {
    const widget = document.getElementById("aiChatWidget");
    if (!widget) return;

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      widget.classList.remove("hidden");
      const input = document.getElementById("aiChatInput");
      if (input) setTimeout(() => input.focus(), 150);
    } else {
      widget.classList.add("hidden");
    }
  },

  closeChat() {
    const widget = document.getElementById("aiChatWidget");
    if (widget) {
      widget.classList.add("hidden");
      this.isOpen = false;
    }
  },

  // 2. Language Selector (Auto, English, Marathi, Hindi)
  setLanguage(lang) {
    this.currentLanguage = lang;

    const autoBtn = document.getElementById("aiLangAutoBtn");
    const enBtn = document.getElementById("aiLangEnBtn");
    const mrBtn = document.getElementById("aiLangMrBtn");
    const hiBtn = document.getElementById("aiLangHiBtn");

    const btnMap = { auto: autoBtn, en: enBtn, mr: mrBtn, hi: hiBtn };
    const langNames = { auto: "Auto Detect 🌐", en: "English 🇬🇧", mr: "मराठी 🚩", hi: "हिंदी 🇮🇳" };

    Object.keys(btnMap).forEach((k) => {
      const b = btnMap[k];
      if (b) {
        if (k === lang) {
          b.className = "px-2 py-0.5 rounded-lg font-bold bg-indigo-600 text-white shadow-sm transition-all";
        } else {
          b.className = "px-2 py-0.5 rounded-lg font-medium text-slate-300 hover:text-white transition-all";
        }
      }
    });

    // Update speech recognition language
    if (this.recognition) {
      if (lang === "mr") this.recognition.lang = "mr-IN";
      else if (lang === "hi") this.recognition.lang = "hi-IN";
      else this.recognition.lang = "en-IN";
    }

    const input = document.getElementById("aiChatInput");
    if (input) {
      if (lang === "mr") input.placeholder = "मराठीमध्ये तुमचा प्रश्न विचारा...";
      else if (lang === "hi") input.placeholder = "हिंदी में अपना प्रश्न पूछें...";
      else if (lang === "en") input.placeholder = "Ask your question in English...";
      else input.placeholder = "Ask in English, मराठी, or हिंदी...";
    }

    NotificationsModule.showToast(`AI Language set to: ${langNames[lang] || lang}`, "info");
  },

  // Detect query language if Auto is selected
  detectLanguage(text) {
    if (this.currentLanguage !== "auto") return this.currentLanguage;

    const t = text.toLowerCase();
    
    // Check for Marathi words or Devanagari specific to Marathi
    const marathiPattern = /[\u0900-\u097F]/;
    const marathiKeywords = /सांगा|स्पष्ट|करा|आहे|नाही|काय|कसे|कशी|झाले|होते|उत्क्रांती|मानवी|नियम|प्रमेय|माहिती|समीकरण|पायथागोरस|केप्लर|sanga|dya|baddal|karan|utkranti|mahiti|kasa|kashi|ahe|nahi|pramey/i;
    const hindiKeywords = /बताइए|समझाइए|है|नहीं|क्या|कैसे|होता|विकास|वंशावली|जानकारी|kya hai|kaise|batao|samjhao|vanshavali|hoti hai|karein/i;

    if (marathiKeywords.test(t)) return "mr";
    if (hindiKeywords.test(t)) return "hi";
    if (marathiPattern.test(t)) return "mr"; // Default Devanagari to Marathi for Maharashtra State Board

    return "en";
  },

  // 3. Set Difficulty / Level (Basic vs Advanced)
  setLevel(level) {
    this.currentLevel = level;

    const basicBtn = document.getElementById("aiLevelBasicBtn");
    const advBtn = document.getElementById("aiLevelAdvBtn");
    const badge = document.getElementById("aiActiveLevelBadge");

    if (basicBtn && advBtn) {
      if (level === "basic") {
        basicBtn.className = "px-2 py-0.5 rounded-lg font-bold bg-emerald-500 text-slate-950 shadow-sm transition-all";
        advBtn.className = "px-2 py-0.5 rounded-lg font-semibold text-slate-300 hover:text-white transition-all";
        if (badge) {
          badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>Basic</span>`;
          badge.className = "text-[10px] font-bold text-emerald-300 flex items-center gap-1";
        }
      } else {
        advBtn.className = "px-2 py-0.5 rounded-lg font-bold bg-amber-500 text-slate-950 shadow-sm transition-all";
        basicBtn.className = "px-2 py-0.5 rounded-lg font-semibold text-slate-300 hover:text-white transition-all";
        if (badge) {
          badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span><span>Advanced</span>`;
          badge.className = "text-[10px] font-bold text-amber-300 flex items-center gap-1";
        }
      }
    }

    NotificationsModule.showToast(`AI Tutor switched to ${level.toUpperCase()} explanation mode! 🎯`, "info");
  },

  setDifficulty(mode) {
    this.setLevel(mode);
  },

  // 4. Open Chat With Specific Prompt & Level
  openChatWithPrompt(prompt, level) {
    const widget = document.getElementById("aiChatWidget");
    if (widget) {
      widget.classList.remove("hidden");
      this.isOpen = true;
    }

    if (level) {
      this.setLevel(level);
    }

    const input = document.getElementById("aiChatInput");
    if (input) {
      input.value = prompt;
    }

    this.sendMessage();
  },

  askQuick(query) {
    this.openChatWithPrompt(query, this.currentLevel);
  },

  // 5. Send Message Handler
  async sendMessage() {
    if (this.isGenerating) return;

    const input = document.getElementById("aiChatInput");
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    input.value = "";

    const detectedLang = this.detectLanguage(query);

    // Add user message to history
    this.chatHistory.push({
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    this.renderMessages();

    // Show AI typing indicator
    this.isGenerating = true;
    this.renderTypingIndicator();

    try {
      const responseText = await this.getAIResponse(query, this.currentLevel, detectedLang);
      this.removeTypingIndicator();

      this.chatHistory.push({
        role: "ai",
        text: responseText,
        mode: this.currentLevel,
        lang: detectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      this.saveHistory();
      this.renderMessages();
    } catch (err) {
      console.error("AI Error:", err);
      this.removeTypingIndicator();

      const fallbackText = this.getOfflineAcademicResponse(query, this.currentLevel, detectedLang);
      this.chatHistory.push({
        role: "ai",
        text: fallbackText,
        mode: this.currentLevel,
        lang: detectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      this.saveHistory();
      this.renderMessages();
    } finally {
      this.isGenerating = false;
    }
  },

  // 6. Multi-Tier Multilingual AI Engine
  async getAIResponse(prompt, level, lang) {
    const q = prompt.trim();
    const cleanLower = q.toLowerCase();

    // Instant offline match check for high school syllabus
    if (
      cleanLower.includes("lineage") ||
      cleanLower.includes("evolution") ||
      cleanLower.includes("ancestor") ||
      cleanLower.includes("उत्क्रांती") ||
      cleanLower.includes("वंशावली") ||
      cleanLower.includes("pythagoras") ||
      cleanLower.includes("पायथागोरस") ||
      cleanLower.includes("पाइथागोरस") ||
      cleanLower.includes("kepler") ||
      cleanLower.includes("केप्लर") ||
      cleanLower.includes("gravitation") ||
      cleanLower.includes("गुरुत्वाकर्षण") ||
      cleanLower.includes("quadratic") ||
      cleanLower.includes("वर्गसमीकरण") ||
      cleanLower.includes("द्विघात") ||
      cleanLower.includes("ohm") ||
      cleanLower.includes("ओहम") ||
      cleanLower.includes("ओम") ||
      cleanLower.includes("periodic") ||
      cleanLower.includes("आवर्त") ||
      cleanLower.includes("photosynthesis") ||
      cleanLower.includes("प्रकाशसंश्लेषण")
    ) {
      return this.getOfflineAcademicResponse(q, level, lang);
    }

    // Tier 1: Try Gemini API if user configured key
    if (this.geminiApiKey) {
      try {
        const geminiRes = await this.callGeminiAPI(q, level, lang);
        if (geminiRes) return geminiRes;
      } catch (e) {
        console.warn("Gemini call error:", e);
      }
    }

    // Tier 2: Try Serverless AI API (Pollinations AI) with Language Instruction
    try {
      const langPrompt = lang === "mr" 
        ? "तुम्ही 'टेक दादा एआय' (Tech Dada AI) आहात. विद्यार्थ्याच्या प्रश्नाचे उत्तर शुद्ध, शैक्षणिक आणि सविस्तर मराठी भाषेत द्या. पायऱ्या, सूत्रे आणि बोर्ड परीक्षेसाठी महत्त्वाचे मुद्दे स्पष्ट करा."
        : lang === "hi"
        ? "आप 'टेक दादा एआई' (Tech Dada AI) हैं। छात्र के प्रश्न का उत्तर शुद्ध, शैक्षणिक और विस्तृत हिंदी भाषा में दें। चरणबद्ध व्याख्या, सूत्र और बोर्ड परीक्षा टिप्स दें।"
        : "You are Tech Dada AI, an expert school tutor for 8th, 9th, and 10th standard State Board students. Answer in English with clear points, derivations, and formulas.";

      const encoded = encodeURIComponent(`System: ${langPrompt} Level: ${level.toUpperCase()}\nStudent: ${q}\nAnswer:`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(`https://text.pollinations.ai/${encoded}?model=openai`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 25) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn("Serverless AI API error:", e);
    }

    // Tier 3: Comprehensive Multilingual Offline Knowledge Base
    return this.getOfflineAcademicResponse(q, level, lang);
  },

  async callGeminiAPI(prompt, level, lang) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    
    let instructions = `You are Tech Dada AI, an expert tutor for 8th, 9th, and 10th standard students. Level: ${level.toUpperCase()}. `;
    if (lang === "mr") instructions += "Answer strictly in fluent, clear Marathi (मराठी). ";
    else if (lang === "hi") instructions += "Answer strictly in clear Hindi (हिंदी). ";
    else instructions += "Answer in clear English. ";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${instructions}\n\nQuestion: ${prompt}` }] }]
      })
    });

    if (!res.ok) throw new Error("Gemini HTTP error " + res.status);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  },

  // 7. Comprehensive Multilingual Offline Knowledge Engine
  getOfflineAcademicResponse(query, level, lang) {
    const q = query.toLowerCase().replace(/expain/g, "explain");

    // ==========================================
    // 1. HUMAN LINEAGE & EVOLUTION
    // ==========================================
    if (
      q.includes("lineage") ||
      q.includes("evolution") ||
      q.includes("ancestor") ||
      q.includes("उत्क्रांती") ||
      q.includes("वंशावली")
    ) {
      if (lang === "mr") {
        return `### 🧬 मानवी उत्क्रांतीची साखळी (Human Lineage in Marathi)
**संदर्भ:** *इयत्ता १० वी - विज्ञान आणि तंत्रज्ञान भाग २ (प्रकरण १: आनुवंशिकता व उत्क्रांती)*

मानवाचा विकास लाखो वर्षांपूर्वी वानरासारख्या पूर्वजांपासून झाला. मानवी उत्क्रांतीचे प्रमुख टप्पे पुढीलप्रमाणे आहेत:

#### १. उत्क्रांतीचे कालक्रमानुसार टप्पे:
1. **ड्रायोपायथिकस व रामापायथिकस** (सुमारे १५ ते २० दशलक्ष वर्षांपूर्वी):
   - झाडांवर राहणारे आफ्रिका आणि आशियातील सुरुवातीचे वानरसदृश पूर्वज.
2. **ऑस्ट्रॅलोपायथिकस (Australopithecus)** (सुमारे ४ ते २ दशलक्ष वर्षांपूर्वी):
   - **पहिला महत्त्वाचा टप्पा:** हे दोन पायांवर ताठ चालणारे पहिले पूर्वज होते (**द्विपाद चलन**). 'ल्युसी' (Lucy) हे यांचे प्रसिद्ध जीवाश्म आहे. मेंदूची क्षमता: **~४५० ते ५०० cc**.
3. **होमो हॅबिलिस (Homo habilis - "कुशल मानव")** (सुमारे २ ते १.५ दशलक्ष वर्षांपूर्वी):
   - हाताने साधी दगडी हत्यारे बनवणारा पहिला मानव. मेंदूची क्षमता: **६५० ते ८०० cc**.
4. **होमो इरेक्टस (Homo erectus - "ताठ चालणारा मानव")** (सुमारे १.५ दशलक्ष ते ३ लाख वर्षांपूर्वी):
   - ताठ पाठीचा कणा आणि सर्वांत महत्त्वाचे म्हणजे **आगीचा शोध व वापर** यांनी लावला! मेंदूची क्षमता: **९०० ते ११०० cc**.
5. **निअँडरथल मानव (Neanderthal Man)** (सुमारे १ लाख ते ४० हजार वर्षांपूर्वी):
   - पहिला बुद्धिमान मानला जाणारा मानव. गुहांमध्ये राहणे, प्राण्यांची कातडी वापरणे आणि मृतांचे दफन संस्कार करणे यांची सुरुवात झाली. मेंदूची क्षमता: **~१४०० cc**.
6. **क्रो-मॅग्नन मानव** (सुमारे ५० हजार वर्षांपूर्वी):
   - प्रगत हाडांची हत्यारे आणि फ्रान्समधील जगप्रसिद्ध गुहाचित्रे बनवणारे पूर्वज.
7. **होमो सेपियन्स सेपियन्स (Homo sapiens - आधुनिक मानव)** (सुमारे १० हजार वर्षांपूर्वी ते आजतागायत):
   - शेती, पशुपालन, लिपी, कला, शहरे आणि आधुनिक विज्ञानाचा विकास. मेंदूची क्षमता: **१३५० ते १४५० cc**.

#### 🎯 बोर्ड परीक्षेसाठी महत्त्वाचे मुद्दे:
* **दोन मुख्य बदल:** ताठ चालणे (Bipedalism) आणि मेंदूच्या आकारात झालेली वाढ.
* **अवशेषांगे (Vestigial Organs):** आंत्रपुच्छ (Appendix), माकडहाड (Coccyx) आणि अक्कलदाढ हे मानवी उत्क्रांतीचे मुख्य पुरावे आहेत!`;
      } else if (lang === "hi") {
        return `### 🧬 मानव विकास की वंशावली (Human Lineage in Hindi)
**संदर्भ:** *कक्षा 10वीं - विज्ञान भाग 2 (आनुवंशिकी और जैव विकास)*

मानव (*Homo sapiens*) का क्रमिक विकास लाखों वर्षों में वानर जैसे पूर्वजों से हुआ:

#### 1. मानव विकास के प्रमुख कालानुक्रमिक चरण:
1. **ड्रायोपिथेकस और रामापिथेकस** (~15-20 मिलियन वर्ष पूर्व):
   - पेड़ों पर रहने वाले शुरुआती वानर समान पूर्वज।
2. **ऑस्ट्रेलोपिथेकस (Australopithecus)** (~4-2 मिलियन वर्ष पूर्व):
   - **पहला बड़ा मील का पत्थर:** दो पैरों पर सीधा चलने की शुरुआत (**द्विपाद चलन**)। मस्तिष्क क्षमता: **~450 cc**।
3. **होमो हैबिलिस (Homo habilis - 'कुशल मानव')** (~2 मिलियन वर्ष पूर्व):
   - पत्थरों से पहले औजार बनाने वाले पहले मानव पूर्वज। मस्तिष्क क्षमता: **650-800 cc**।
4. **होमो इरेक्टस (Homo erectus - 'सीधा चलने वाला मानव')** (~1.5 मिलियन वर्ष पूर्व):
   - पूरी तरह सीधी रीढ़ की हड्डी और **आग की खोज और नियंत्रण**! मस्तिष्क क्षमता: **900-1100 cc**।
5. **निएंडरथल मानव (Neanderthal Man)** (~1,00,000 से 40,000 वर्ष पूर्व):
   - गुफाओं में रहना, जानवरों की खाल पहनना और मृतकों का रीति-रिवाजों से अंतिम संस्कार। मस्तिष्क क्षमता: **~1400 cc**।
6. **क्रो-मैग्नन मानव** (~50,000 वर्ष पूर्व):
   - उन्नत औजार और गुफा चित्रकला का विकास।
7. **होमो सेपियन्स सेपियन्स (Homo sapiens - आधुनिक मानव)** (~10,000 वर्ष पूर्व से वर्तमान):
   - कृषि, भाषा, समाज, संस्कृति और विज्ञान का विकास। मस्तिष्क क्षमता: **1350-1450 cc**।

💡 **बोर्ड परीक्षा टिप:** द्विपाद गमन (दो पैरों पर चलना) और मस्तिष्क क्षमता में वृद्धि मानव विकास के दो सबसे महत्वपूर्ण आधार हैं।`;
      } else {
        // English
        return `### 🧬 Lineage of Human Evolution (10th SSC Board Special)
**Reference:** *Science & Technology Part 2 - Chapter 1: Heredity & Evolution*

Human lineage traces morphological and cranial progression from tree-dwelling primates to modern *Homo sapiens sapiens*:

#### 1. Chronological Evolutionary Stages:
* **Dryopithecus & Ramapithecus (20–15 Mya):** Early Miocene primates; Ramapithecus showed early hominid dental development.
* **Australopithecus (approx. 4–2 Mya):** Discovered in East Africa (e.g., "Lucy"). Milestone of **bipedal locomotion** and upright posture. Cranial capacity: **450–500 cc**.
* **Homo habilis (approx. 2–1.5 Mya):** Recognized as the **"Handy Man"**. First hominid to manufacture primitive stone tools. Cranial capacity: **650–800 cc**.
* **Homo erectus (approx. 1.5 Mya–300,000 ya):** Known as the **"Upright Man"**. Perfectly erect posture; **discovery and control of fire**; spread to Eurasia. Cranial capacity: **900–1100 cc**.
* **Homo neanderthalensis (Neanderthal Man, 100,000–40,000 ya):** First wise human ancestor. Constructed cave shelters, wore animal hides, and held ceremonial burials. Cranial capacity: **~1400 cc**.
* **Cro-Magnon Man (approx. 50,000 ya):** Prehistoric modern human with advanced bone tools and renowned cave paintings.
* **Homo sapiens sapiens (Modern Intelligent Human, approx. 10,000 ya to present):** Development of agriculture, animal domestication, written script, and technology. Cranial capacity: **1350–1450 cc**.

#### 🎯 High-Weightage Board Exam Points:
1. **Evidences of Evolution:** Morphological, Anatomical, and Vestigial organs (Appendix, Coccyx, Wisdom teeth).
2. **Key Milestones:** Bipedal upright walking and continuous cranial capacity enlargement!`;
      }
    }

    // ==========================================
    // 2. PYTHAGORAS THEOREM
    // ==========================================
    if (q.includes("pythagoras") || q.includes("पायथागोरस") || q.includes("पाइथागोरस")) {
      if (lang === "mr") {
        return `### 📐 पायथागोरसचा सिद्धांत (Pythagoras Theorem in Marathi)
**इयत्ता १० वी - गणित भाग २ (भूमिती - प्रकरण २)**

**विधान:** काटकोन त्रिकोणात कर्णाचा वर्ग हा इतर दोन बाजूंच्या वर्गांच्या बेरजेइतका असतो.

**पक्ष:** $\\triangle ABC$ मध्ये, $\\angle ABC = 90^\\circ$.  
**साध्य:** $AC^2 = AB^2 + BC^2$.  
**रचना:** शिरोबिंदू $B$ मधून कर्ण $AC$ वर लंब $BD$ काढा असा की $A-D-C$.

#### सिद्धता (काटकोन त्रिकोणांची समरूपता):
1. काटकोन त्रिकोणात कर्णावर टाकलेल्या शिरोलंबामुळे तयार होणारे दोन्ही त्रिकोण मूळ त्रिकोणाशी समरूप असतात:
   $$\\triangle ABC \\sim \\triangle ADB \\sim \\triangle BDC$$
2. $\\triangle ABC \\sim \\triangle ADB$ वरून:
   $$\\frac{AB}{AD} = \\frac{AC}{AB} \\implies AB^2 = AD \\times AC \\quad \\text{--- (विधान १)}$$
3. $\\triangle ABC \\sim \\triangle BDC$ वरून:
   $$\\frac{BC}{DC} = \\frac{AC}{BC} \\implies BC^2 = DC \\times AC \\quad \\text{--- (विधान २)}$$
4. विधान (१) आणि (२) यांची बेरीज करू:
   $$AB^2 + BC^2 = (AD \\times AC) + (DC \\times AC)$$
   $$AB^2 + BC^2 = AC(AD + DC)$$
   परंतु $AD + DC = AC$ ($A-D-C$ असल्यामुळे):
   $$AB^2 + BC^2 = AC \\times AC = AC^2$$
   $$\\mathbf{AC^2 = AB^2 + BC^2} \\quad \\text{(सिद्ध झाले!)}$$`;
      } else if (lang === "hi") {
        return `### 📐 पाइथागोरस प्रमेय (Pythagoras Theorem in Hindi)
**कक्षा 10वीं - गणित (ज्यामिति)**

**कथन:** एक समकोण त्रिभुज में कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है।

**दिया है:** $\\triangle ABC$ में, $\\angle ABC = 90^\\circ$।  
**सिद्ध करना है:** $AC^2 = AB^2 + BC^2$।  
**रचना:** $BD \\perp AC$ खींचिए ($A-D-C$)।

#### उपपत्ति (समरूपता द्वारा):
1. $\\triangle ABC \\sim \\triangle ADB \\implies \\frac{AB}{AD} = \\frac{AC}{AB} \\implies AB^2 = AD \\times AC$ (समीकरण 1)
2. $\\triangle ABC \\sim \\triangle BDC \\implies \\frac{BC}{DC} = \\frac{AC}{BC} \\implies BC^2 = DC \\times AC$ (समीकरण 2)
3. समीकरण (1) और (2) को जोड़ने पर:
   $$AB^2 + BC^2 = AC(AD + DC) = AC \\times AC = AC^2$$
   $$\\mathbf{AC^2 = AB^2 + BC^2} \\quad \\text{(इति सिद्धम्)}$$`;
      } else {
        return `### 📐 Pythagoras Theorem Proof (10th SSC Geometry - 4 Marks)
**Statement:** In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the remaining two sides.  
**Given:** In $\\triangle ABC$, $\\angle ABC = 90^\\circ$.  
**To Prove:** $AC^2 = AB^2 + BC^2$.  
**Proof:** By similarity of right-angled triangles $\\triangle ABC \\sim \\triangle ADB \\sim \\triangle BDC$:
1. $AB^2 = AD \\times AC$
2. $BC^2 = DC \\times AC$
3. Adding both: $AB^2 + BC^2 = AC(AD + DC) = AC^2$. Hence Proved!`;
      }
    }

    // ==========================================
    // 3. KEPLER'S LAWS & GRAVITATION
    // ==========================================
    if (q.includes("kepler") || q.includes("केप्लर") || q.includes("गुरुत्वाकर्षण") || q.includes("gravitation")) {
      if (lang === "mr") {
        return `### 🪐 केप्लरचे तीन नियम आणि गुरुत्वाकर्षण (Kepler's Laws in Marathi)
**इयत्ता १० वी - विज्ञान भाग १ (प्रकरण १: गुरुत्वाकर्षण)**

1. **केप्लरचा पहिला नियम (कक्षेचा नियम):**
   ग्रहाची कक्षा ही लंबगोलाकार असून सूर्य त्या कक्षेच्या एका नाभीवर असतो.
2. **केप्लरचा दुसरा नियम (क्षेत्रफळाचा नियम):**
   ग्रहाला सूर्याशी जोडणारी सरळ रेषा समान कालावधीत समान क्षेत्रफळ व्यापन करते.
3. **केप्लरचा तिसरा नियम (आवर्तकालाचा नियम):**
   सूर्याची परिक्रमा करणाऱ्या ग्रहाच्या आवर्तकालाचा वर्ग ($T^2$) हा ग्रहाच्या सूर्यापासूनच्या सरासरी अंतराच्या घनाशी ($r^3$) समप्रमाणात असतो:
   $$\\frac{T^2}{r^3} = \\text{स्थिरांक} (K)$$

#### न्यूटनचा वैश्विक गुरुत्वाकर्षणाचा सिद्धांत:
$$F = G \\frac{m_1 m_2}{d^2}$$
* $G = 6.67 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$ (वैश्विक गुरुत्व स्थिरांक)`;
      } else if (lang === "hi") {
        return `### 🪐 केप्लर के तीन नियम (Kepler's Laws in Hindi)
1. **प्रथम नियम (कक्षाओं का नियम):** प्रत्येक ग्रह सूर्य के चारों ओर एक दीर्घवृत्ताकार (elliptical) कक्षा में परिक्रमा करता है और सूर्य इसके एक फोकस पर होता है।
2. **द्वितीय नियम (क्षेत्रफलीय चाल का नियम):** सूर्य और ग्रह को मिलाने वाली रेखा समान समय अंतरालों में समान क्षेत्रफल तय करती है।
3. **तृतीय नियम (परिक्रमण काल का नियम):** ग्रह के परिक्रमण काल का वर्ग ($T^2$) सूर्य से उसकी औसत दूरी के घन ($r^3$) के समानुपाती होता है: $\\frac{T^2}{r^3} = K$।`;
      } else {
        return `### 🪐 Kepler's Three Laws of Planetary Motion (Science 1)
1. **First Law:** Planetary orbits are ellipses with Sun at one focus.
2. **Second Law:** Line joining planet and Sun sweeps equal areas in equal time intervals.
3. **Third Law:** $T^2 / r^3 = \\text{Constant} (K)$.
Newton's Law: $F = G \\frac{m_1 m_2}{d^2}$ ($G = 6.67 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$).`;
      }
    }

    // ==========================================
    // 4. QUADRATIC EQUATIONS
    // ==========================================
    if (q.includes("quadratic") || q.includes("वर्गसमीकरण") || q.includes("द्विघात")) {
      if (lang === "mr") {
        return `### 🔢 वर्गसमीकरणे आणि सूत्र पद्धत (Quadratic Equations in Marathi)
**सामान्य रूप:** $ax^2 + bx + c = 0 \\quad (a \\neq 0)$

#### वर्गसमीकरणाचे सूत्र:
$$\\mathbf{x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}$$

#### विवेचक (Discriminant $\\Delta = b^2 - 4ac$):
* $\\Delta > 0$: मुळे वास्तव व असमान असतात.
* $\\Delta = 0$: मुळे वास्तव व समान असतात ($x = -b/2a$).
* $\\Delta < 0$: मुळे वास्तव संख्या नसतात.`;
      } else if (lang === "hi") {
        return `### 🔢 द्विघात समीकरण और श्रीधराचार्य सूत्र (Quadratic Equations in Hindi)
**मानक रूप:** $ax^2 + bx + c = 0 \\quad (a \\neq 0)$

#### द्विघात सूत्र:
$$\\mathbf{x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}$$
* विविक्तकर ($D = b^2 - 4ac$):
  - $D > 0$: दो वास्तविक और भिन्न मूल।
  - $D = 0$: दो वास्तविक और बराबर मूल।
  - $D < 0$: कोई वास्तविक मूल नहीं।`;
      } else {
        return `### 🔢 Quadratic Equations & Formula Derivation
Standard Form: $ax^2 + bx + c = 0$ ($a \\neq 0$).  
Formula: $\\mathbf{x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}$. Discriminant $\\Delta = b^2 - 4ac$.`;
      }
    }

    // ==========================================
    // 5. OHM'S LAW
    // ==========================================
    if (q.includes("ohm") || q.includes("ओहम") || q.includes("ओम")) {
      if (lang === "mr") {
        return `### ⚡ ओहमचा नियम (Ohm's Law in Marathi)
**नियम:** वाहकाची भौतिक अवस्था कायम असताना, वाहकातून वाहणारी विद्युतधारा ($I$) ही वाहकाच्या दोन टोकांमधील विभवांतराशी ($V$) समप्रमाणात असते:

$$V = I \\times R$$
* $V$ = विभवांतर (व्होल्ट, $\\text{V}$)
* $I$ = विद्युतधारा (अँपिअर, $\\text{A}$)
* $R$ = वाहकाचा रोध (ओहम, $\\Omega$)`;
      } else if (lang === "hi") {
        return `### ⚡ ओम का नियम (Ohm's Law in Hindi)
**नियम:** यदि किसी चालक की भौतिक अवस्थाएं (ताप, लम्बाई) स्थिर रहें, तो चालक के सिरों पर लगाया गया विभवान्तर ($V$) उसमें प्रवाहित विद्युत धारा ($I$) के अनुक्रमानुपाती होता है:
$$V = I \\times R$$`;
      } else {
        return `### ⚡ Ohm's Law ($V = IR$)
At constant temperature, current ($I$) flowing through a conductor is directly proportional to potential difference ($V$) across its ends. $V = I \\times R$.`;
      }
    }

    // ==========================================
    // 6. PHOTOSYNTHESIS
    // ==========================================
    if (q.includes("photosynthesis") || q.includes("प्रकाशसंश्लेषण")) {
      if (lang === "mr") {
        return `### 🍃 प्रकाशसंश्लेषण प्रक्रिया (Photosynthesis in Marathi)
वनस्पती हरितद्रव्य आणि सूर्यप्रकाशाच्या साहाय्याने हवेतील कार्बन डायऑक्साइड व मुळांनी शोषलेले पाणी वापरून अन्न तयार करतात:

$$6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow[\\text{हरितद्रव्य}]{\\text{सूर्यप्रकाश}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\uparrow + 6\\text{H}_2\\text{O}$$
* **तयार होणारे घटक:** ग्लुकोज (अन्न) + ऑक्सिजन वायू बाहेर पडतो.`;
      } else if (lang === "hi") {
        return `### 🍃 प्रकाश संश्लेषण (Photosynthesis in Hindi)
पौधे सूर्य के प्रकाश और क्लोरोफिल की उपस्थिति में कार्बन डाइऑक्साइड और जल से ग्लूकोज और ऑक्सीजन का निर्माण करते हैं:
$$6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow[\\text{क्लोरोफिल}]{\\text{सूर्यप्रकाश}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 + 6\\text{H}_2\\text{O}$$`;
      } else {
        return `### 🍃 Photosynthesis Equation:
$$6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\uparrow + 6\\text{H}_2\\text{O}$$`;
      }
    }

    // ==========================================
    // 7. MULTILINGUAL GENERAL FALLBACK
    // ==========================================
    if (lang === "mr") {
      return `### 📚 टेक दादा शैक्षणिक उत्तर: "${query}"

**पातळी:** ${level.toUpperCase()} (मराठी माध्यम)

#### १. मूळ संकल्पना आणि व्याख्या:
**"${query}"** हा घटक माध्यमिक शालेय अभ्यासक्रमातील (महाराष्ट्र स्टेट बोर्ड) अत्यंत महत्त्वाचा विषय आहे. या संकल्पनेची मूलभूत व्याख्या आणि सिद्धांत समजून घेणे परीक्षेत पैकीच्या पैकी गुण मिळवण्यासाठी आवश्यक आहे.

#### २. महत्त्वाचे मुद्दे आणि पायऱ्या:
* **मुख्य नियम/सिद्धांत:** या प्रकरणातील वैज्ञानिक नियम किंवा गणिती सूत्रे अचूकपणे लक्षात ठेवा.
* **आकृती व सूत्रे:** बोर्ड परीक्षेतील मोठ्या प्रश्नांसाठी सुबक व नामनिर्देशित आकृत्या उजव्या बाजूस पेन्सिलने काढा.
* **उदाहरणे व पायऱ्या:** दिलेली माहिती, सूत्र, किंमती भरणे आणि अंतिम उत्तराला योग्य एकक (Unit) लिहिणे बंधनकारक आहे.

💡 *टीप: कोणत्याही विशिष्ट प्रकरणावर शंका असल्यास 'टेक दादा एआय' ला मराठीत थेट विचारा!*`;
    } else if (lang === "hi") {
      return `### 📚 टेक दादा शैक्षणिक उत्तर: "${query}"

**स्तर:** ${level.toUpperCase()} (हिंदी माध्यम)

#### 1. मूल अवधारणा और सिद्धांत:
**"${query}"** से संबंधित विषय बोर्ड परीक्षा पाठ्यक्रम का एक अत्यंत महत्वपूर्ण अंग है। इस अवधारणा को अच्छी तरह समझने से परीक्षा में अधिकतम अंक प्राप्त होते हैं।

#### 2. महत्वपूर्ण बिंदु और टिप्स:
* **सिद्धांत और सूत्र:** मूल नियमों और गणितीय सूत्रों को स्पष्ट रूप से समझें।
* **चित्र और इकाइयां:** भौतिक विज्ञान और जीव विज्ञान के प्रश्नों में स्वच्छ नामांकित चित्र और सही मात्रक (SI Units) अवश्य लिखें।

💡 *सुझाव: अपने किसी भी सवाल को आप हिंदी में कभी भी टेक दादा से पूछ सकते हैं!*`;
    } else {
      return `### 📚 Tech Dada Academic Solution: "${query}"

**Level:** ${level.toUpperCase()}

#### 1. Core Principle & Definition:
The question on **"${query}"** relates to key concepts in the state board and CBSE high school curriculum. 

#### 2. Essential Framework:
* **Fundamental Law:** Understand the primary scientific principle or mathematical derivation.
* **Standard Representation:** Write given data, formula, calculation steps, and final SI units.

💡 *Tip: Feel free to ask any question in English, मराठी, or हिंदी anytime!*`;
    }
  },

  // 8. Render Chat Messages
  renderMessages() {
    const container = document.getElementById("aiChatMessages");
    if (!container) return;

    if (this.chatHistory.length === 0) {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm animate-pulse">
            <i data-lucide="sparkles" class="w-8 h-8"></i>
          </div>
          <h4 class="font-extrabold text-slate-700 text-sm sm:text-base">Ask Dada AI Anything!</h4>
          <p class="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
            इंग्रजी, मराठी किंवा हिंदीमध्ये प्रश्न विचारा! I am trained on 8th, 9th & 10th Standard Science, Maths, and State Board curriculum.
          </p>
          <div class="mt-4 flex flex-wrap justify-center gap-1.5">
            <button onclick="AIChatModule.openChatWithPrompt('मानवी उत्क्रांतीची साखळी स्पष्ट करा', 'advanced')" class="px-2.5 py-1 rounded-full text-[11px] bg-amber-50 text-amber-900 font-bold border border-amber-200">
              🧬 मानवी उत्क्रांती (मराठी)
            </button>
            <button onclick="AIChatModule.openChatWithPrompt('मानव विकास की वंशावली समझाइए', 'advanced')" class="px-2.5 py-1 rounded-full text-[11px] bg-orange-50 text-orange-900 font-bold border border-orange-200">
              🧬 मानव वंशावली (हिंदी)
            </button>
            <button onclick="AIChatModule.openChatWithPrompt('Explain the lineage of human evolution', 'advanced')" class="px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              🧬 Lineage (English)
            </button>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = this.chatHistory.map((msg) => {
      const isUser = msg.role === "user";
      return `
        <div class="flex items-start gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}">
          <div class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
            isUser ? "bg-indigo-600 text-white" : "bg-gradient-to-tr from-amber-500 to-orange-500 text-white"
          }">
            ${isUser ? '<i data-lucide="user" class="w-4 h-4"></i>' : '<i data-lucide="bot" class="w-4 h-4"></i>'}
          </div>

          <div class="max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
              : "bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-sm"
          }">
            ${
              !isUser && msg.mode
                ? `<div class="mb-1 flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                    <span>${msg.mode} mode</span>
                    ${msg.lang ? `<span>•</span><span class="text-amber-700 font-bold">${msg.lang.toUpperCase()}</span>` : ""}
                    <span>•</span>
                    <span class="text-slate-400">${msg.timestamp || ""}</span>
                   </div>`
                : ""
            }
            <div class="ai-rendered-content whitespace-pre-wrap">${this.formatMarkdown(msg.text)}</div>
            ${
              isUser
                ? `<div class="text-[10px] text-indigo-200 text-right mt-1">${msg.timestamp || ""}</div>`
                : ""
            }
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
    container.scrollTop = container.scrollHeight;
  },

  // 9. Typing indicator
  renderTypingIndicator() {
    const container = document.getElementById("aiChatMessages");
    if (!container) return;

    const div = document.createElement("div");
    div.id = "aiTypingIndicator";
    div.className = "flex items-start gap-2.5 mb-4";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2 text-xs text-slate-500">
        <span class="font-bold text-indigo-600">Dada AI is thinking...</span>
        <div class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style="animation-delay: 0.2s"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style="animation-delay: 0.4s"></span>
        </div>
      </div>
    `;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons();
    container.scrollTop = container.scrollHeight;
  },

  removeTypingIndicator() {
    const indicator = document.getElementById("aiTypingIndicator");
    if (indicator) indicator.remove();
  },

  // 10. Markdown Formatter
  formatMarkdown(text) {
    if (!text) return "";
    return text
      .replace(/^### (.*$)/gim, '<h4 class="font-black text-slate-900 text-sm mt-2 mb-1">$1</h4>')
      .replace(/^#### (.*$)/gim, '<h5 class="font-bold text-slate-800 text-xs mt-2 mb-1">$1</h5>')
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-[11px]">$1</code>');
  },

  // 11. Multilingual Voice Recognition Setup
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage === "mr" ? "mr-IN" : this.currentLanguage === "hi" ? "hi-IN" : "en-IN";

    this.recognition.onstart = () => {
      this.isListening = true;
      const micBtn = document.getElementById("aiVoiceMicBtn");
      if (micBtn) {
        micBtn.classList.add("bg-rose-500", "text-white", "animate-pulse");
      }
      NotificationsModule.showToast("Listening... Speak in English, मराठी, or हिंदी! 🎙️", "info");
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById("aiChatInput");
      if (input && transcript) {
        input.value = transcript;
        this.sendMessage();
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      const micBtn = document.getElementById("aiVoiceMicBtn");
      if (micBtn) {
        micBtn.classList.remove("bg-rose-500", "text-white", "animate-pulse");
      }
    };

    this.recognition.onerror = () => {
      this.isListening = false;
      const micBtn = document.getElementById("aiVoiceMicBtn");
      if (micBtn) {
        micBtn.classList.remove("bg-rose-500", "text-white", "animate-pulse");
      }
    };
  },

  toggleVoiceInput() {
    if (!this.recognition) {
      alert("Voice input is not supported in this browser. Please type your question.");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        if (this.currentLanguage === "mr") this.recognition.lang = "mr-IN";
        else if (this.currentLanguage === "hi") this.recognition.lang = "hi-IN";
        else this.recognition.lang = "en-IN";

        this.recognition.start();
      } catch (e) {}
    }
  },

  // 12. Google Gemini Key Modal
  openKeyModal() {
    const modal = document.getElementById("geminiKeyModal");
    const input = document.getElementById("geminiKeyInput");
    if (input) input.value = this.geminiApiKey || "";
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  },

  closeKeyModal() {
    const modal = document.getElementById("geminiKeyModal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  },

  saveGeminiKey() {
    const input = document.getElementById("geminiKeyInput");
    const key = input ? input.value.trim() : "";
    this.geminiApiKey = key;
    localStorage.setItem("techdada_gemini_key", key);
    this.closeKeyModal();

    if (key) {
      NotificationsModule.showToast("Gemini Live AI Connected successfully! 🚀", "success");
    } else {
      NotificationsModule.showToast("Gemini key cleared. Using Tech Dada Multi-Tier Engine.", "info");
    }
  },

  // 13. Local Storage Persistence
  saveHistory() {
    try {
      localStorage.setItem("techdada_ai_history", JSON.stringify(this.chatHistory.slice(-20)));
    } catch (e) {}
  },

  loadHistory() {
    try {
      const stored = localStorage.getItem("techdada_ai_history");
      if (stored) {
        this.chatHistory = JSON.parse(stored);
      }
    } catch (e) {}
  },

  clearChat() {
    this.chatHistory = [];
    localStorage.removeItem("techdada_ai_history");
    this.renderMessages();
    NotificationsModule.showToast("Chat history cleared.", "info");
  }
};

window.AIChatModule = AIChatModule;
