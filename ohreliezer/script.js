
        // API Configuration
        const API_BASE = 'https://still-rain-097dmekomos-api.ephraim-7a6.workers.dev';
        let isOffline = false;

        // HTML escape function to prevent XSS
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Admin status is now stored in the database
        // To make someone an admin, run in D1 console: UPDATE users SET is_admin=1 WHERE uid='user_xyz'
        let isAdmin = false;
        let currentAdminTarget = null;

        let currentUser = null, userData = null, currentStatus = null, pendingVote = null;
        let currentLang = 'en';
        let pollInterval = null;
        let wasDesktop = false;
        let activeMapCardId = null;

        function isDesktop() {
            return window.innerWidth >= 1024;
        }

        const i18n = {
            en: {
                dates: "Feb 10 (23 Shevat) — Feb 15, 2026",
                hero: "Mekomos<br><span class='text-indigo-400'>Hakdoshim</span>",
                attendance: "Joining?",
                roster: "Group Roster",
                live: "Live Updates",
                editName: "Edit Name",
                itinerary: "Itinerary",
                modalTitle: "Display Name",
                modalSub: "Enter your name for the group list.",
                saveBtn: "SAVE CHANGES",
                directions: "Directions",
                showLess: "Show Less",
                showDetails: "Show Details",
                info: "Travel Info",
                packing: "Packing List",
                types: { travel: "Travel", prayer: "Prayer", hotel: "Hotel", shabbos: "Shabbos" },
                days: { Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" }
            },
            yi: {
                dates: "כ״ג שבט — כ״ח שבט, תשפ״ו",
                hero: "מקומות<br><span class='text-indigo-400'>הקדושים</span>",
                attendance: "קומט מיט?",
                roster: "די גרופע",
                live: "לייוו דערהיינטיגונג",
                editName: "טויש נאמען",
                itinerary: "סדר הנסיעה",
                modalTitle: "נאמען",
                modalSub: "לייגט אריין אייער נאמען.",
                saveBtn: "היטן טוישונגען",
                directions: "דיירעקציע",
                showLess: "ווייניגער",
                showDetails: "מער פרטים",
                info: "מידע לנסיעה",
                packing: "רשימת חפצים",
                types: { travel: "רייזע", prayer: "תפילה", hotel: "אכסניא", shabbos: "שבת" },
                days: { Tue: "ג׳", Wed: "ד׳", Thu: "ה׳", Fri: "עש״ק", Sat: "שב״ק", Sun: "א׳" }
            }
        };

        // Vote labels (used for the RSVP buttons)
        i18n.en.votes = { positive: "YES", negative: "NO", neutral: "MAYBE" };
        i18n.yi.votes = { positive: "יא", negative: "ניין", neutral: "מעגליך" };

        const icons = {
            travel: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
            prayer: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
            hotel: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M17 21v-2a1 1 0 00-1-1H8a1 1 0 00-1 1v2"/><path d="M4 18V7a2 2 0 012-2h12a2 2 0 012 2v11"/></svg>`,
            shabbos: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
            navigate: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
            chevron: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`
        };

        const itinerary = [
            { day: "Tue", dateNum: "10", stops: [
                { id: 1, type: "travel", time: "9:00 PM", title: {en:"Departure from NY", yi:"אפפליען פון ניו יארק"}, loc: "JFK Airport", query: "JFK Airport Terminal", desc: {en:"Depart on Swiss Air LX15. Shachris on flight if possible.", yi:"אפפליען מיט סוויס ער LX15. שחרית אויפן פלי אויב מעגליך."} }
            ] },
            { day: "Wed", dateNum: "11", stops: [
                { id: 20, type: "travel", time: "2:05 PM", title: {en:"Arrival Budapest", yi:"אנקומען קיין בודאפעסט"}, loc: "Budapest Airport", query: "Budapest Airport", desc: {en:"Arrival. Mincha at baggage claim. Breakfast/lunch on bus.", yi:"אנקומען. מנחה ביים באגאזש. פרישטאג/מיטאג אויפן באס."} },
                { id: 21, type: "prayer", time: "5:30 PM", title: {en:"Ratzfert Cemetery", yi:"ראצפערט בית החיים"}, loc: {en:"Ratzfert", yi:"ראצפערט"}, query: "Rácalmás Jewish Cemetery, Hungary", desc: {en:"Mikvah, toilets, cemetery visit.", yi:"מקוה, באזוך אויפן בית החיים."} },
                { id: 22, type: "prayer", time: "7:00 PM", title: {en:"Kalov Cemetery", yi:"קאלוב בית החיים"}, loc: {en:"Kalov", yi:"קאלוב"}, query: "Nagykálló Jewish Cemetery, Hungary", desc: {en:"Cemetery visit.", yi:"באזוך אויפן בית החיים."} },
                { id: 23, type: "prayer", time: "8:45 PM", title: {en:"Kerestir", yi:"קערעסטיר"}, loc: {en:"Bodrogkeresztúr", yi:"קערעסטיר"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Maariv, dinner, siyum, historical talk by R' Yaakov Farber.", yi:"מעריב, סעודה, סיום, היסטארישע רעדע פון ר׳ יעקב פארבער."} },
                { id: 24, type: "hotel", time: "10:25 PM", title: {en:"Hotel Minnaro", yi:"האטעל מינארא"}, loc: {en:"Tokaj", yi:"טאקאי"}, query: "Hotel & Winery & SPA & Restaurant Minnaro Tokaj Hungary", desc: {en:"Check-in. Coffee/tea/snacks available overnight.", yi:"אריינטשעקן. קאווע/טיי/סנעקס דורכאויס די נאכט."} }
            ]},
            { day: "Thu", dateNum: "12", stops: [
                { id: 30, type: "prayer", time: "7:30 AM", title: {en:"Morning in Tokaj", yi:"פרימארגן אין טאקאי"}, loc: {en:"Hotel Minnaro", yi:"האטעל מינארא"}, query: null, desc: {en:"Hotel checkout, Mikvah & Shachris. Two buses depart.", yi:"אויסטשעקן, מקוה און שחרית. צוויי באסן פארן אפ."} },
                { id: 31, type: "prayer", time: "8:45 AM", title: {en:"Kerestir Breakfast", yi:"פרישטאג אין קערעסטיר"}, loc: {en:"Kerestir Shul", yi:"קערעסטירער שול"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Breakfast in shul.", yi:"פרישטאג אין שול."} },
                { id: 32, type: "prayer", time: "10:00 AM", title: {en:"Kerestir Cemetery", yi:"קערעסטירער בית החיים"}, loc: {en:"Reb Shayala's Tziyun", yi:"רבי ישעי׳לעס ציון"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Very important — leaving on time is critical.", yi:"זייער וויכטיג — מען מוז אפגיין אויף דער צייט."} },
                { id: 33, type: "prayer", time: "11:15 AM", title: {en:"Liska", yi:"ליסקא"}, loc: {en:"Reb Hershele Lisker", yi:"הרה״ק ר׳ הערשעלע ליסקער"}, query: "Olaszliszka Cemetery", desc: {en:"Quick cemetery stop.", yi:"א שנעלער באזוך אויפן בית החיים."} },
                { id: 34, type: "prayer", time: "12:15 PM", title: {en:"Ihel", yi:"אוהעל"}, loc: {en:"Yismach Moshe", yi:"דער הייליגער ישמח משה"}, query: "Sátoraljaújhely Jewish Cemetery", desc: {en:"Cemetery visit. Divrei hisorerus by the Rav.", yi:"באזוך אויפן בית החיים. דברי התעוררות פונעם רב."} },
                { id: 35, type: "prayer", time: "4:30 PM", title: {en:"Tanz", yi:"צאנז"}, loc: {en:"Historic Shul", yi:"היסטארישע שול"}, query: "Nowy Sącz Jewish Cemetery", desc: {en:"Historic shul visit, Mincha, light meal.", yi:"באזוך אין היסטארישע שול, מנחה, לייכטע סעודה."} },
                { id: 36, type: "hotel", time: "8:15 PM", title: {en:"Krakow Hotel", yi:"קראקא האטעל"}, loc: {en:"Krakow", yi:"קראקא"}, query: "Kazimierz Krakow", desc: {en:"Check-in (remaining for rest of trip).", yi:"אריינטשעקן (בלייבן דא פאר דער רעשט פון טריפ)."} },
                { id: 37, type: "prayer", time: "9:15 PM", title: {en:"Maariv & Shiur", yi:"מעריב און שיעור"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Maariv followed by weekly shiur by R' Yoel Lefkowitz.", yi:"מעריב, שיעור פון ר׳ יואל לעפקאוויטש."} },
                { id: 38, type: "hotel", time: "10:00 PM", title: {en:"Dinner & Kumzitz", yi:"סעודה און קומזיץ"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Main dinner, siyum & kumzitz.", yi:"הויפט סעודה, סיום און קומזיץ."} }
            ]},
            { day: "Fri", dateNum: "13", stops: [
                { id: 40, type: "prayer", time: "8:30 AM", title: {en:"Shachris & Breakfast", yi:"שחרית און פרישטאג"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shachris & breakfast at hotel.", yi:"שחרית און פרישטאג אין האטעל."} },
                { id: 41, type: "prayer", time: "11:10 AM", title: {en:"Krakow Cemetery", yi:"קראקא בית החיים"}, loc: {en:"Rema & Others", yi:"דער רמ״א און אנדערע צדיקים"}, query: "Old Jewish Cemetery, Kraków", desc: {en:"Shul & cemetery visit with divrei Torah.", yi:"שול און בית החיים באזוך מיט דברי תורה."} },
                { id: 42, type: "travel", time: "12:40 PM", title: {en:"Jewish Quarter Tour", yi:"טור אין יידישן קווארטאל"}, loc: {en:"Kazimierz", yi:"קאזימירז"}, query: "Kazimierz, Kraków", desc: {en:"Guided tour of the Jewish Quarter.", yi:"געפירטער טור אין יידישן קווארטאל."} },
                { id: 43, type: "hotel", time: "1:40 PM", title: {en:"Shabbos Prep", yi:"שבת צוגרייטונג"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Return to hotel. Shabbos prep, rest, mikvah, shvitz.", yi:"צוריק צום האטעל. שבת צוגרייטונג, רו, מקוה, שוויץ."} },
                { id: 44, type: "shabbos", time: "4:39 PM", title: {en:"Candle Lighting", yi:"ליכט צינדן"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Candle lighting.", yi:"ליכט צינדן."} },
                { id: 45, type: "shabbos", time: "5:30 PM", title: {en:"Shabbos Mincha", yi:"מנחה שב״ק"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shabbos Mincha.", yi:"מנחה שבת קודש."} },
                { id: 46, type: "shabbos", time: "7:00 PM", title: {en:"Shiur", yi:"שיעור"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shiur after Maariv.", yi:"שיעור נאך מעריב."} },
                { id: 47, type: "shabbos", time: "7:30 PM", title: {en:"Shabbos Meal", yi:"שבת סעודה"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Drashos by R' Yoel Lefkowitz & R' Mallach.", yi:"דרשות פון ר׳ יואל לעפקאוויטש און ר׳ מלאך."} }
            ]},
            { day: "Sat", dateNum: "14", stops: [
                { id: 50, type: "shabbos", time: "Morning", title: {en:"Shabbos Davening", yi:"שחרית שב״ק"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shachris, kiddush, Shabbos meal.", yi:"שחרית, קידוש, שבת סעודה."} },
                { id: 51, type: "shabbos", time: "5:30 PM", title: {en:"Mincha & Havdalah", yi:"מנחה און הבדלה"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Mincha, drasha, Havdalah.", yi:"מנחה, דרשה, הבדלה."} },
                { id: 52, type: "travel", time: "8:30 PM", title: {en:"Travel to Lizensk", yi:"נסיעה קיין ליזענסק"}, loc: {en:"~90 min drive", yi:"~90 מינוט פארן"}, query: "Leżajsk Cemetery, Poland", desc: {en:"Depart to Lizensk (~90 min after Havdalah).", yi:"פארן קיין ליזענסק (~90 מינוט נאך הבדלה)."} },
                { id: 53, type: "prayer", time: "10:45 PM", title: {en:"Lizensk", yi:"ליזענסק"}, loc: {en:"Rebbe Reb Elimelech", yi:"רבי ר׳ אלימלך"}, query: "Leżajsk Cemetery, Poland", desc: {en:"Melava Malka & cemetery visit after chatzos.", yi:"מלוה מלכה און באזוך אויפן בית החיים נאך חצות."} },
                { id: 54, type: "travel", time: "3:30 AM", title: {en:"Return to Krakow", yi:"צוריק קיין קראקא"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Return to hotel.", yi:"צוריק צום האטעל."} }
            ]},
            { day: "Sun", dateNum: "15", stops: [
                { id: 60, type: "travel", time: "8:45 AM", title: {en:"Hotel Checkout", yi:"אויסטשעקן"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Checkout. Daven & breakfast on bus.", yi:"אויסטשעקן. דאווענען און פרישטאג אויפן באס."} },
                { id: 61, type: "travel", time: "10:15 AM", title: {en:"Auschwitz", yi:"אוישוויץ"}, loc: {en:"Oswiecim", yi:"אוישוויץ"}, query: "Auschwitz-Birkenau Memorial", desc: {en:"Guided visit with R' Yaakov Farber.", yi:"געפירטער באזוך מיט ר׳ יעקב פארבער."} },
                { id: 62, type: "travel", time: "1:30 PM", title: {en:"Departure from KRK", yi:"אפפליען פון קראקא"}, loc: {en:"KRK Airport", yi:"קראקא לופטפעלד"}, query: "Kraków Airport", desc: {en:"Departure to NY.", yi:"אפפליען קיין ניו יארק."} },
                { id: 63, type: "travel", time: "8:30 PM", title: {en:"Arrival in NY", yi:"אנקומען קיין ניו יארק"}, loc: "JFK Airport", query: "JFK Airport", desc: {en:"Welcome home!", yi:"ברוך הבא אהיים!"} }
            ]}
        ];

        const travelInfo = {
            en: [
                { heading: "Luggage", items: ["1 checked bag up to 50LB is for free"] },
                { heading: "Phone & Connectivity", items: ["Make sure your phone works internationally and has a reasonable price per day", "If not, rent a phone or SIM card for the trip"] },
                { heading: "Weather", items: ["Weather in Europe is similar to the weather here"] },
                { heading: "Hotel Notes", items: ["Mini bars in the hotel rooms charge a lot — if you take anything remember it's your bill", "There will be a specific room filled with drinks, snacks, cookies that will be for free"] },
                { heading: "On-Trip Help", items: ["There will be someone traveling with us from Linsoa, he will be able to answer/help with your needs if possible"] },
                { heading: "Religious Items Note", items: ["Siddur & Chumash donated by R' Shloma Goldstein", "Tehillim is available at every Tzion", "Lecht mostly available, but recommended to take a few"] }
            ],
            yi: [
                { heading: "באגאזש", items: ["1 טשעקד בעג ביז 50 פונט איז פריי"] },
                { heading: "טעלעפאן", items: ["זייט זיכער אז אייער טעלעפאן ארבעט אינטערנאציאנאל מיט א רעזאנאבלע פרייז פער טאג", "אויב נישט, רענט א טעלעפאן אדער SIM קארטל פארן טריפ"] },
                { heading: "וועטער", items: ["דער וועטער אין אייראפע איז ענליך צום וועטער דא"] },
                { heading: "האטעל", items: ["מיני בארס אין צימערן קאסטן טייער — אויב איר נעמט עפעס, געדענקט אז עס איז אייער חשבון", "עס וועט זיין א ספעציעלער צימער מיט פריי געטראנקן, סנעקס, קוקיס"] },
                { heading: "הילף אויפן טריפ", items: ["עמיצער פון לינסא רייזט מיט אונז, ער וועט קענען העלפן מיט אייערע באדערפענישן"] },
                { heading: "רעליגיעזע זאכן נאטיץ", items: ["סידור און חומש געשאנקען פון ר' שלמה גאלדשטיין", "תהלים איז דא ביי יעדן ציון", "לעכט איז מערסטנס דא, אבער רעקאמענדירט צו נעמען א פאר"] }
            ]
        };

        const packingList = {
            en: [
                { id: "essentials", heading: "Essentials", items: [
                    {id: "essentials_0", label: "Tefillin"},
                    {id: "essentials_1", label: "Passport"},
                    {id: "essentials_2", label: "Charger"},
                    {id: "essentials_3", label: "Adapter"},
                    {id: "religious_0", label: "Siddur & Chumash", detail: "Donated by R' Shloma Goldstein", locked: true},
                    {id: "religious_1", label: "Tehillim", detail: "Available at every Tzion", locked: true},
                    {id: "religious_2", label: "Lecht", detail: "Mostly available, but recommended to take a few"}
                ]},
                { id: "clothing", heading: "Clothing", items: [
                    {id: "clothing_0", label: "Boots/Kalachin"},
                    {id: "clothing_1", label: "Coat & Sweater"},
                    {id: "clothing_2", label: "4-5 sets of clothes"},
                    {id: "clothing_3", label: "Extra pairs of socks"},
                    {id: "clothing_4", label: "Pajamas"},
                    {id: "clothing_5", label: "Bathing suit", detail: "For shvitz"},
                    {id: "clothing_6", label: "Shabbos clothes", detail: "Shtramel, Bakitcha"}
                ]},
                { id: "food", heading: "Food", items: [
                    {id: "food_0", label: "Tuesday night dinner", detail: "Kosher food is ordered but isn't always good/enough"},
                    {id: "food_1", label: "Snacks/cookies/chips/sweets for the flight"}
                ]},
                { id: "other", heading: "Other", items: [
                    {id: "essentials_4", label: "Air plugs"},
                    {id: "religious_3", label: "Sefer/Gemara/reading material"},
                    {id: "other_1", label: "Tylenol/Motrin/Tums/Bandages"},
                    {id: "other_2", label: "Lenses solution"},
                    {id: "other_3", label: "Cigarettes", detail: "If you smoke"},
                    {id: "other_4", label: "Fresh wipes", detail: "If you need"},
                    {id: "other_5", label: "Deodorant", detail: "If you need"}
                ]}
            ],
            yi: [
                { id: "essentials", heading: "עסענציעלס", items: [
                    {id: "essentials_0", label: "תפילין"},
                    {id: "essentials_1", label: "פאספארט"},
                    {id: "essentials_2", label: "טשארזשער"},
                    {id: "essentials_3", label: "אדאפטער"},
                    {id: "religious_0", label: "סידור און חומש", detail: "געשאנקען פון ר' שלמה גאלדשטיין", locked: true},
                    {id: "religious_1", label: "תהלים", detail: "דא ביי יעדן ציון", locked: true},
                    {id: "religious_2", label: "לעכט", detail: "מערסטנס דא, אבער רעקאמענדירט צו נעמען א פאר"}
                ]},
                { id: "clothing", heading: "בגדים", items: [
                    {id: "clothing_0", label: "שטיוול/קאלאטשן"},
                    {id: "clothing_1", label: "מאנטל און סוועטער"},
                    {id: "clothing_2", label: "4-5 זעטס בגדים"},
                    {id: "clothing_3", label: "עקסטרא זאקן"},
                    {id: "clothing_4", label: "פיזשאמעס"},
                    {id: "clothing_5", label: "באדינג סוט", detail: "פאר שוויץ"},
                    {id: "clothing_6", label: "שבת בגדים", detail: "שטריימל, באקיטשע"}
                ]},
                { id: "food", heading: "עסן", items: [
                    {id: "food_0", label: "דינסטאג נאכט סעודה", detail: "כשר עסן איז באשטעלט אבער איז נישט אלעמאל גוט/גענוג"},
                    {id: "food_1", label: "סנעקס/קוקיס/טשיפס/זיסן פארן פלי"}
                ]},
                { id: "other", heading: "אנדערע", items: [
                    {id: "essentials_4", label: "ער פלאגס"},
                    {id: "religious_3", label: "ספר/גמרא/לייענונג מאטריאל"},
                    {id: "other_1", label: "טיילענאל/מאטרין/טאמס/באנדאזשעס"},
                    {id: "other_2", label: "לענזעס סאליושאן"},
                    {id: "other_3", label: "סיגארעטן", detail: "אויב איר רויכערט"},
                    {id: "other_4", label: "פרישע וויפס", detail: "אויב איר דארפט"},
                    {id: "other_5", label: "דעאדאראנט", detail: "אויב איר דארפט"}
                ]}
            ]
        };

        let currentTab = 'itinerary';
        let checkedItems = new Set();

        const catStyles = { travel: "bg-blue-50 text-blue-600", prayer: "bg-indigo-50 text-indigo-600", hotel: "bg-emerald-50 text-emerald-600", shabbos: "bg-amber-50 text-amber-700" };

        window.setLanguage = (lang) => {
            currentLang = lang;
            document.body.dir = lang === 'yi' ? 'rtl' : 'ltr';
            // set page language attribute
            try { document.documentElement.lang = lang; } catch (e) {}
            // update URL param without removing other params (e.g., token)
            try {
                const u = new URL(window.location.href);
                u.searchParams.set('lang', lang);
                window.history.replaceState({}, document.title, u.toString());
            } catch (e) {}
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(`btn-${lang}`).classList.add('active');
            
            const t = i18n[lang];
            document.getElementById('txt-dates').innerText = t.dates;
            document.getElementById('txt-hero').innerHTML = t.hero;
            document.getElementById('txt-attendance').innerText = t.attendance;
            document.getElementById('txt-roster').innerText = t.roster;
            document.getElementById('txt-live').innerText = t.live;
            document.getElementById('txt-edit-name').innerText = t.editName;
            // Sidebar labels
            try {
                document.getElementById('txt-roster-sidebar').innerText = t.roster;
                document.getElementById('txt-live-sidebar').innerText = t.live;
                document.getElementById('txt-edit-name-sidebar').innerText = t.editName;
            } catch (e) {}
            document.getElementById('txt-modal-title').innerText = t.modalTitle;
            document.getElementById('txt-modal-sub').innerText = t.modalSub;
            document.getElementById('txt-save-btn').innerText = t.saveBtn;
            // update RSVP button labels
            try {
                const btnYes = document.getElementById('global-going');
                const btnMaybe = document.getElementById('global-maybe');
                const btnNo = document.getElementById('global-no');
                if (btnYes) btnYes.innerText = t.votes?.positive || 'YES';
                if (btnMaybe) btnMaybe.innerText = t.votes?.neutral || 'MAYBE';
                if (btnNo) btnNo.innerText = t.votes?.negative || 'NO';
            } catch (e) {}
            
            // Update tab labels
            try {
                document.getElementById('tab-label-itinerary').innerText = t.itinerary;
                document.getElementById('tab-label-info').innerText = t.info;
                document.getElementById('tab-label-packing').innerText = t.packing;
            } catch (e) {}

            renderTimeline();
            if (currentTab === 'info') renderInfo();
            if (currentTab === 'packing') renderPackingList();
            if (typeof closeMapPanel === 'function') closeMapPanel();
        };

        async function init() {
            try {
                // Check for uid in URL (for syncing across devices)
                const urlParams = new URLSearchParams(window.location.search);
                const urlUid = urlParams.get('uid');

                // Get or create a persistent user ID
                let uid = urlUid || localStorage.getItem('mekomos_user_id');
                if (!uid) {
                    uid = 'user_' + Math.random().toString(36).substring(2, 15);
                }
                localStorage.setItem('mekomos_user_id', uid);

                // Clean up URL if uid was in it
                if (urlUid) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('uid');
                    window.history.replaceState({}, document.title, newUrl.toString());
                }

                currentUser = { uid };

                // Load user profile from API
                try {
                    const res = await fetch(`${API_BASE}/api/users/${uid}`);
                    const profile = await res.json();
                    if (profile && profile.name) {
                        userData = { name: profile.name };
                        document.getElementById('user-name-input').value = userData.name;
                        isAdmin = profile.is_admin === 1;
                    }
                } catch (e) {
                    console.warn("Could not load profile:", e);
                }

                // Load RSVPs, checklist, and start polling
                await fetchRsvps();
                await fetchChecklist();
                setupRsvpPolling();

                // Hide offline badge and show user info
                document.getElementById('offline-badge').classList.add('hidden');
                updateUserInfoDisplay();
            } catch (e) {
                console.warn("Switching to Offline Mode:", e.message);
                isOffline = true;
                document.getElementById('offline-badge').classList.remove('hidden');
                document.getElementById('sync-link-container').classList.add('hidden');

                // Load local profile if exists
                const localName = localStorage.getItem('local_user_name');
                if (localName) {
                    userData = { name: localName };
                    document.getElementById('user-name-input').value = localName;
                }

                // Load local RSVP
                currentStatus = localStorage.getItem('local_rsvp_status');
                updateVoteButtons(currentStatus);
                updateUserInfoDisplay();
                renderAttendees(userData ? [{
                    uid: 'local-user',
                    name: userData.name,
                    initials: userData.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2),
                    status: currentStatus
                }] : []);
            }
        }

        window.copyAuthLink = () => {
            if (isOffline || !currentUser) return;
            // Share user ID for syncing across devices
            const syncUrl = `${window.location.origin}${window.location.pathname}?uid=${currentUser.uid}`;
            navigator.clipboard.writeText(syncUrl).then(() => {
                showStatusBar("Sync Link Copied!");
            }).catch(() => {
                // Fallback for older browsers
                const dummy = document.createElement("textarea");
                document.body.appendChild(dummy);
                dummy.value = syncUrl;
                dummy.select();
                document.execCommand("copy");
                document.body.removeChild(dummy);
                showStatusBar("Sync Link Copied!");
            });
        };

        async function fetchRsvps() {
            if (isOffline) return;
            try {
                const res = await fetch(`${API_BASE}/api/rsvps`);
                if (!res.ok) throw new Error('Failed to fetch RSVPs');
                const list = await res.json();
                renderAttendees(list || []);
                const my = (list || []).find(r => r.uid === currentUser.uid);
                currentStatus = my ? my.status : null;
                updateVoteButtons(currentStatus);
            } catch (err) {
                console.error("Fetch RSVPs error:", err);
                // Don't show error on every poll failure, just log it
            }
        }

        function setupRsvpPolling() {
            if (isOffline) return;
            // Poll every 10 seconds for updates
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = setInterval(fetchRsvps, 10000);
        }

        window.handleVote = async (status) => {
            if (currentStatus === status) { 
                currentStatus = null;
            } else {
                currentStatus = status;
            }

            if (!userData) { 
                pendingVote = currentStatus; 
                openNameModal(); 
                return; 
            }

            if (isOffline) {
                localStorage.setItem('local_rsvp_status', currentStatus);
                renderAttendees([{ 
                    uid: 'local-user', 
                    name: userData.name, 
                    initials: userData.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2), 
                    status: currentStatus 
                }]);
                updateVoteButtons(currentStatus);
                showStatusBar("Saved Locally");
            } else {
                saveVote(currentUser.uid, userData.name, currentStatus);
            }
        };

        window.openNameModal = () => document.getElementById('name-modal').classList.add('active');
        window.closeNameModal = () => document.getElementById('name-modal').classList.remove('active');
        window.closeNameModalOnBackdrop = (e) => { if (e.target.id === 'name-modal') closeNameModal(); };
        window.submitName = async () => {
            const name = document.getElementById('user-name-input').value.trim();
            if (!name) return;
            userData = { name };

            if (isOffline) {
                localStorage.setItem('local_user_name', name);
                closeNameModal();
                if (pendingVote !== null) {
                    localStorage.setItem('local_rsvp_status', pendingVote);
                    currentStatus = pendingVote;
                    pendingVote = null;
                }
                updateVoteButtons(currentStatus);
                updateUserInfoDisplay();
                renderAttendees([{
                    uid: 'local-user',
                    name: userData.name,
                    initials: userData.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2),
                    status: currentStatus
                }]);
            } else {
                // Save user profile to API
                try {
                    const res = await fetch(`${API_BASE}/api/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: currentUser.uid, name: userData.name })
                    });
                    if (!res.ok) throw new Error('Failed to save profile');
                    closeNameModal();
                    updateUserInfoDisplay();
                    if (pendingVote !== null) {
                        saveVote(currentUser.uid, userData.name, pendingVote);
                        pendingVote = null;
                    } else if (currentStatus) {
                        saveVote(currentUser.uid, userData.name, currentStatus);
                    }
                } catch (err) {
                    console.error("Save profile error:", err);
                    showStatusBar("Error saving name - try again");
                }
            }
        };

        async function saveVote(uid, name, status) {
            try {
                if (!status) {
                    const res = await fetch(`${API_BASE}/api/rsvps/${uid}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to remove RSVP');
                    await fetchRsvps();
                    showStatusBar("RSVP Removed");
                    return;
                }
                const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2);
                const res = await fetch(`${API_BASE}/api/rsvps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid, name, initials, status })
                });
                if (!res.ok) throw new Error('Failed to save RSVP');
                await fetchRsvps();
                showStatusBar("RSVP Updated");
            } catch (err) {
                console.error("Save vote error:", err);
                showStatusBar("Error saving - try again");
            }
        }

        function showStatusBar(text) {
            const bar = document.getElementById('bottom-status-bar');
            document.getElementById('status-text').innerText = text;
            bar.classList.remove('hidden-bar');
            setTimeout(() => bar.classList.add('hidden-bar'), 3000);
        }

        window.handleDirectionsClick = function(event, encodedQuery, title, cardId) {
            if (!isDesktop()) return true; // on mobile, let link open normally

            event.preventDefault();

            const mapPanel = document.getElementById('map-panel');
            const mapIframe = document.getElementById('map-iframe');
            const mapPlaceholder = document.getElementById('map-placeholder');
            const mapHeader = document.getElementById('map-header');
            const mapTitle = document.getElementById('map-title');
            const mapLink = document.getElementById('map-external-link');

            if (!mapPanel || !mapIframe) return false;

            const query = decodeURIComponent(encodedQuery);
            const iframeSrc = `https://maps.google.com/maps?q=${encodedQuery}&output=embed`;

            mapIframe.src = iframeSrc;
            mapIframe.classList.remove('hidden');
            mapIframe.classList.add('loading');
            mapPlaceholder.classList.add('hidden');
            mapHeader.classList.remove('hidden');
            mapHeader.style.display = 'flex';
            if (mapTitle) mapTitle.innerText = decodeURIComponent(title);
            if (mapLink) mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

            mapIframe.onload = () => mapIframe.classList.remove('loading');

            // Highlight the active itinerary card
            if (activeMapCardId) {
                const prev = document.getElementById(`card-${activeMapCardId}`);
                if (prev) prev.classList.remove('map-active');
            }
            activeMapCardId = cardId;
            const card = document.getElementById(`card-${cardId}`);
            if (card) card.classList.add('map-active');

            mapPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return false;
        };

        window.closeMapPanel = function() {
            const mapIframe = document.getElementById('map-iframe');
            const mapPlaceholder = document.getElementById('map-placeholder');
            const mapHeader = document.getElementById('map-header');

            if (mapIframe) { mapIframe.src = ''; mapIframe.classList.add('hidden'); }
            if (mapPlaceholder) mapPlaceholder.classList.remove('hidden');
            if (mapHeader) { mapHeader.classList.add('hidden'); mapHeader.style.display = ''; }

            if (activeMapCardId) {
                const prev = document.getElementById(`card-${activeMapCardId}`);
                if (prev) prev.classList.remove('map-active');
                activeMapCardId = null;
            }
        };

        function updateUserInfoDisplay() {
            // Mobile user info
            const container = document.getElementById('user-info');
            const nameDisplay = document.getElementById('user-display-name');
            const adminBadge = document.getElementById('admin-badge');

            // Sidebar user info
            const sidebarContainer = document.getElementById('user-info-sidebar');
            const sidebarName = document.getElementById('user-display-name-sidebar');
            const sidebarAdmin = document.getElementById('admin-badge-sidebar');

            if (userData && userData.name) {
                if (nameDisplay) nameDisplay.innerText = userData.name;
                if (container) { container.classList.remove('hidden'); container.classList.add('flex'); }
                if (sidebarName) sidebarName.innerText = userData.name;
                if (sidebarContainer) { sidebarContainer.classList.remove('hidden'); sidebarContainer.style.display = 'flex'; }

                if (isAdmin) {
                    if (adminBadge) adminBadge.classList.remove('hidden');
                    if (sidebarAdmin) sidebarAdmin.classList.remove('hidden');
                } else {
                    if (adminBadge) adminBadge.classList.add('hidden');
                    if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
                }
            } else {
                if (container) { container.classList.add('hidden'); container.classList.remove('flex'); }
                if (sidebarContainer) { sidebarContainer.classList.add('hidden'); }
            }
        }

        window.openAdmin = (uid, name) => {
            if (isOffline) return;
            if (!isAdmin) return;
            currentAdminTarget = { uid, name };
            document.getElementById('admin-target-name').innerText = name;
            document.getElementById('admin-target-uid').innerText = uid;
            document.getElementById('admin-modal').classList.add('active');
        };

        window.adminUpdateStatus = async (status) => {
            if (!currentAdminTarget || isOffline) return;
            await saveVote(currentAdminTarget.uid, currentAdminTarget.name, status);
            document.getElementById('admin-modal').classList.remove('active');
        };

        function updateVoteButtons(status) {
            ['going', 'maybe', 'no'].forEach(s => {
                const btn = document.getElementById(`global-${s}`);
                if (btn) btn.className = s === status ? "flex-1 py-3 rounded-2xl text-[11px] font-extrabold rsvp-active" : "flex-1 py-3 rounded-2xl text-[11px] font-extrabold border border-white/10 text-indigo-100 transition-all";
            });
        }

        function renderAttendees(list) {
            const container = document.getElementById('attendees-list');
            const goingCount = list.filter(a => a.status === 'going').length;
            const countLabel = `${goingCount} Joined`;

            // Update mobile count
            const mobileCount = document.getElementById('attendee-count');
            if (mobileCount) mobileCount.innerText = countLabel;

            // Update sidebar count
            const sidebarCount = document.getElementById('attendee-count-sidebar');
            if (sidebarCount) sidebarCount.innerText = countLabel;

            // Filter out users with no status
            const activeList = list.filter(a => a.status);

            // Mobile attendees list
            const itemsHtml = activeList.map(a => `
                <div onclick="openAdmin('${escapeHtml(a.uid)}', '${escapeHtml(a.name)}')" class="flex items-center gap-1.5 bg-slate-50 border border-slate-100 pl-1 pr-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-transform">
                    <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">${escapeHtml(a.initials)}</div>
                    <span class="text-[10px] font-bold text-slate-700">${escapeHtml(a.name)}</span>
                    <div class="w-1.5 h-1.5 rounded-full ${a.status === 'going' ? 'bg-emerald-400' : (a.status === 'no' ? 'bg-rose-500' : 'bg-slate-300')}"></div>
                </div>`).join('');

            if (container) {
                container.innerHTML = itemsHtml;
                if (!document.getElementById('attendees-fade')) {
                    const fade = document.createElement('div');
                    fade.id = 'attendees-fade';
                    fade.className = 'absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-white/60 pointer-events-none transition-opacity duration-300 z-20';
                    fade.style.opacity = '1';
                    container.appendChild(fade);
                }
            }

            // Sidebar attendees (desktop)
            const sidebarList = document.getElementById('sidebar-attendees-list');
            if (sidebarList) {
                sidebarList.innerHTML = activeList.map(a => `
                    <div onclick="openAdmin('${escapeHtml(a.uid)}', '${escapeHtml(a.name)}')" class="flex items-center gap-1 bg-white/10 pl-0.5 pr-2 py-0.5 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
                        <div class="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center text-[7px] font-bold">${escapeHtml(a.initials)}</div>
                        <span class="text-[9px] font-bold text-indigo-100">${escapeHtml(a.name)}</span>
                        <div class="w-1.5 h-1.5 rounded-full ${a.status === 'going' ? 'bg-emerald-400' : (a.status === 'no' ? 'bg-rose-400' : 'bg-white/40')}"></div>
                    </div>`).join('');
            }
        }

        // Developer helper: generate mock attendees for UI testing
        window.generateMockAttendees = function(n = 30) {
            const container = document.getElementById('attendees-list');
            if (!container) {
                console.error('generateMockAttendees: attendees-list element not found. Call after page load.');
                return;
            }

            const names = [
                'Avi Cohen','Sara Rosen','Moshe Katz','Leah Blum','Dovid Miller','Esther Green','Yossi Stein','Rachel Weiss','Shimon Levy','Miriam Gold'
            ];
            const statuses = ['going','maybe','no'];
            const mock = [];
            for (let i = 0; i < n; i++) {
                const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : '');
                const status = statuses[i % statuses.length];
                const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0,2);
                mock.push({ uid: `mock-${i}`, name, initials, status });
            }

            renderAttendees(mock);

            // if many, keep collapsed so fade shows; otherwise expand
            if (n > 6) {
                container.setAttribute('data-collapsed','true');
                container.style.maxHeight = '3.5rem';
                const fade = document.getElementById('attendees-fade'); if (fade) fade.style.opacity = '1';
                const text = document.getElementById('reveal-text'); if (text) text.innerText = i18n[currentLang].showDetails;
                const icon = document.getElementById('reveal-icon'); if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                container.setAttribute('data-collapsed','false');
                container.style.maxHeight = 'none';
                const fade = document.getElementById('attendees-fade'); if (fade) fade.style.opacity = '0';
                const text = document.getElementById('reveal-text'); if (text) text.innerText = i18n[currentLang].showLess;
                const icon = document.getElementById('reveal-icon'); if (icon) icon.style.transform = 'rotate(180deg)';
            }
        };

    function toggleAttendeesList() {
        const container = document.getElementById('attendees-list');
        const text = document.getElementById('reveal-text');
        const icon = document.getElementById('reveal-icon');
        const fade = document.getElementById('attendees-fade');

        // Use a data attribute to track collapsed state (more reliable than computed style checks)
        const wasCollapsed = container.getAttribute('data-collapsed') !== 'false';

        if (wasCollapsed) {
            // Expand
            container.style.maxHeight = 'none';
            container.setAttribute('data-collapsed', 'false');
            if (fade) fade.style.opacity = '0';
            if (text) text.innerText = i18n[currentLang].showLess;
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            // Collapse
            container.style.maxHeight = '3.5rem';
            container.setAttribute('data-collapsed', 'true');
            if (fade) fade.style.opacity = '1';
            if (text) text.innerText = i18n[currentLang].showDetails;
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }

        window.toggleCard = (id) => {
            const el = document.getElementById(`expand-${id}`), btn = document.getElementById(`btn-${id}`);
            const isOpen = el.classList.toggle('open');
            btn.querySelector('span').innerText = isOpen ? i18n[currentLang].showLess : i18n[currentLang].showDetails;
            btn.querySelector('svg').style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        function renderTimeline() {
            const container = document.getElementById('timeline-container');
            const t = i18n[currentLang];
            container.innerHTML = `<div class="timeline-line-bg"></div>` + itinerary.map(day => `
                <div class="day-section mb-12">
                    <div class="day-sidebar">
                        <div class="sticky-wrapper">
                            <div class="date-badge">
                                <span class="text-[8px] font-black text-indigo-200 uppercase">${t.days[day.day]}</span>
                                <span class="text-xl font-black text-indigo-950">${day.dateNum}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex-grow space-y-4">
                        ${day.stops.map(s => {
                            const hasLongNotes = !!s.longNotes;
                            const hasQuery = !!s.query;
                            const shouldAutoExpand = hasQuery && !hasLongNotes;
                            const locLabel = typeof s.loc === 'object' ? s.loc[currentLang] : s.loc;
                            
                            const dirLink = hasQuery ? `
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query)}"
                                           onclick="return handleDirectionsClick(event, '${encodeURIComponent(s.query)}', '${encodeURIComponent(s.title[currentLang])}', ${s.id})"
                                           target="_blank" class="nav-link-minimal">
                                            ${icons.navigate} <span>${t.directions}</span>
                                        </a>` : '';

                            return `
                            <div id="card-${s.id}" class="itinerary-card bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="category-pill ${catStyles[s.type] || 'bg-slate-50 text-slate-600'}">${icons[s.type] || ''}${t.types[s.type]}</div>
                                    <span class="text-[10px] lg:text-xs font-bold text-slate-400">${s.time}</span>
                                </div>
                                <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${s.title[currentLang]}</h3>
                                <div class="flex items-center justify-between">
                                    <p class="text-[10px] lg:text-xs font-bold text-indigo-500 uppercase tracking-wide">${locLabel}</p>
                                    ${shouldAutoExpand ? dirLink : ''}
                                </div>
                                <p class="text-slate-500 text-xs mt-3 leading-relaxed">${s.desc[currentLang]}</p>
                                <div id="expand-${s.id}" class="card-expand-content ${shouldAutoExpand && !hasLongNotes ? '' : 'open'} ${hasLongNotes ? '' : 'always-open'}">
                                    ${hasLongNotes ? `<p class="text-slate-400 text-[10px] mb-4 italic leading-relaxed border-l-2 border-indigo-50 pl-3">${s.longNotes}</p>` : ''}
                                    ${hasLongNotes ? dirLink : ''}
                                </div>
                                ${hasLongNotes ? `
                                    <button onclick="toggleCard(${s.id})" id="btn-${s.id}" class="mt-4 flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                        <span>${t.showDetails}</span><span class="transition-transform">${icons.chevron}</span>
                                    </button>
                                ` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </div>`).join('');
        }
        
        function renderInfo() {
            const container = document.getElementById('info-container');
            if (!container) return;
            const sections = travelInfo[currentLang] || travelInfo.en;
            container.innerHTML = sections.map(section => `
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 mb-3">${escapeHtml(section.heading)}</h3>
                    <ul class="space-y-2">
                        ${section.items.map(item => `
                            <li class="flex items-start gap-2 text-xs text-slate-600">
                                <span class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                                <span>${escapeHtml(item)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');
        }

        async function fetchChecklist() {
            if (isOffline || !currentUser) return;
            try {
                const res = await fetch(`${API_BASE}/api/checklist/${currentUser.uid}`);
                if (!res.ok) return;
                const items = await res.json();
                checkedItems.clear();
                (items || []).forEach(i => { if (i.checked) checkedItems.add(i.item_id); });
            } catch (e) {
                console.warn("Could not load checklist:", e);
            }
        }

        window.toggleCheckItem = async function(itemId) {
            const isChecked = checkedItems.has(itemId);
            if (isChecked) {
                checkedItems.delete(itemId);
            } else {
                checkedItems.add(itemId);
            }
            renderPackingList();

            if (isOffline || !currentUser) {
                // Save locally as fallback
                localStorage.setItem('local_checklist', JSON.stringify([...checkedItems]));
                return;
            }
            try {
                await fetch(`${API_BASE}/api/checklist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUser.uid, item_id: itemId, checked: !isChecked })
                });
            } catch (e) {
                console.error("Save checklist error:", e);
            }
        };

        function renderPackingList() {
            const container = document.getElementById('packing-container');
            if (!container) return;
            const sections = packingList[currentLang] || packingList.en;
            container.innerHTML = sections.map(section => `
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 mb-3">${escapeHtml(section.heading)}</h3>
                    <ul class="space-y-2">
                        ${section.items.map(item => {
                            const isLocked = item.locked === true;
                            const checked = isLocked || checkedItems.has(item.id);
                            const infoIcon = item.detail ? `<span class="check-info-trigger relative inline-block ml-1 align-middle" onclick="event.stopPropagation()"><svg class="text-slate-300 hover:text-indigo-400 transition-colors" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span class="check-tooltip">${escapeHtml(item.detail)}</span></span>` : '';
                            const mobileDetail = item.detail ? `<span class="check-detail-mobile text-[10px] text-slate-400 block md:hidden">${escapeHtml(item.detail)}</span>` : '';
                            return `
                            <li class="check-item flex items-start gap-3 ${isLocked ? 'opacity-60 cursor-default' : 'cursor-pointer'} select-none" ${isLocked ? '' : `onclick="toggleCheckItem('${item.id}')"`}>
                                <div class="check-box mt-0.5 ${checked ? 'checked' : ''}">
                                    ${checked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <span class="text-xs ${checked ? 'line-through text-slate-400' : 'text-slate-700'}">${escapeHtml(item.label)}${infoIcon}</span>
                                    ${mobileDetail}
                                </div>
                            </li>`;
                        }).join('')}
                    </ul>
                </div>
            `).join('');
        }

        const tabRoutes = { itinerary: 'itinerary', info: 'info', packing: 'packing' };

        window.switchTab = function(tab, pushHash = true) {
            if (!tabRoutes[tab]) tab = 'itinerary';
            currentTab = tab;
            const tabs = ['itinerary', 'info', 'packing'];
            tabs.forEach(t => {
                const container = document.getElementById(`tab-${t}`);
                const btn = document.getElementById(`tab-btn-${t}`);
                if (container) container.classList.toggle('hidden', t !== tab);
                if (btn) {
                    btn.classList.toggle('tab-active', t === tab);
                    btn.classList.toggle('tab-inactive', t !== tab);
                }
            });
            if (tab === 'info') renderInfo();
            if (tab === 'packing') renderPackingList();
            if (pushHash) {
                history.pushState({ tab }, '', '#' + tab);
            }
        };

        function getTabFromHash() {
            const hash = window.location.hash.replace('#', '');
            return tabRoutes[hash] || 'itinerary';
        }

        window.addEventListener('popstate', () => {
            switchTab(getTabFromHash(), false);
        });

        // Re-render when crossing the desktop breakpoint
        window.addEventListener('resize', () => {
            const nowDesktop = isDesktop();
            if (nowDesktop !== wasDesktop) {
                wasDesktop = nowDesktop;
                renderTimeline();
                if (!nowDesktop) closeMapPanel();
            }
        });

        window.onload = () => {
            wasDesktop = isDesktop();
            // On load, respect `lang` URL parameter if present
            try {
                const params = new URLSearchParams(window.location.search);
                const langParam = params.get('lang');
                if (langParam && i18n[langParam]) {
                    setLanguage(langParam);
                } else {
                    setLanguage(currentLang);
                }
            } catch (e) {
                setLanguage(currentLang);
            }

            // Ensure reveal button text reflects language and collapsed state
            try {
                const container = document.getElementById('attendees-list');
                const text = document.getElementById('reveal-text');
                const icon = document.getElementById('reveal-icon');
                const fade = document.getElementById('attendees-fade');
                // initialize collapsed state attribute if missing
                if (container && container.getAttribute('data-collapsed') == null) {
                    container.setAttribute('data-collapsed', 'true');
                    container.style.maxHeight = '3.5rem';
                    if (fade) fade.style.opacity = '1';
                    if (text) text.innerText = i18n[currentLang].showDetails;
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    const isCollapsed = container && container.getAttribute('data-collapsed') === 'true';
                    if (isCollapsed) {
                        if (text) text.innerText = i18n[currentLang].showDetails;
                        if (icon) icon.style.transform = 'rotate(0deg)';
                        if (fade) fade.style.opacity = '1';
                    } else {
                        if (text) text.innerText = i18n[currentLang].showLess;
                        if (icon) icon.style.transform = 'rotate(180deg)';
                        if (fade) fade.style.opacity = '0';
                    }
                }
            } catch (e) {}

            // Route to tab from URL hash
            const initialTab = getTabFromHash();
            if (initialTab !== 'itinerary') {
                switchTab(initialTab, false);
            }

            init();
        };