
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
        let commentPollInterval = null;
        let wasDesktop = false;
        let activeMapCardId = null;

        function isDesktop() {
            return window.innerWidth >= 1024;
        }

        const i18n = {
            en: {
                attendance: "Joining?",
                editName: "Enter Name",
                joined: "Joined",
                itinerary: "Itinerary",
                modalTitle: "Display Name",
                modalSub: "Enter your name for the group list.",
                saveBtn: "SAVE CHANGES",
                directions: "Directions",
                showLess: "Show Less",
                showDetails: "Show Details",
                showMore: "Show More",
                showLessNames: "Show Less",
                info: "Travel Info",
                packing: "Packing List",
                comments: "Comments",
                commentsHeading: "Share a Thought",
                postBtn: "POST COMMENT",
                commentPlaceholder: "Write a message... (@ to mention)",
                deleteComment: "Delete",
                editComment: "Edit",
                edited: "edited",
                confirmDelete: "Delete this message?",
                cancel: "Cancel",
                replying: "Replying to",
                you: "You",
                messagePlaceholder: "Write a message...",
                justNow: "Just now",
                minutesAgo: "min ago",
                hoursAgo: "h ago",
                daysAgo: "d ago",
                noComments: "No comments yet. Be the first to share!",
                types: { travel: "Travel", prayer: "Prayer", hotel: "Hotel", shabbos: "Shabbos" },
                days: { Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" }
            },
            yi: {
                attendance: "קומט מיט?",
                editName: "שרייב נאמען",
                joined: "קומען",
                itinerary: "סדר הנסיעה",
                modalTitle: "נאמען",
                modalSub: "לייגט אריין אייער נאמען.",
                saveBtn: "היטן טוישונגען",
                directions: "דיירעקציע",
                showLess: "ווייניגער",
                showDetails: "מער פרטים",
                showMore: "ווייז מער",
                showLessNames: "ווייז ווייניגער",
                info: "אינפארמאציע",
                packing: "ליסטע",
                comments: "קאמענטן",
                commentsHeading: "שרייב א געדאנק",
                postBtn: "פאסטן קאמענט",
                commentPlaceholder: "...שרייבט א מעסעדזש (@ צו טאַגן)",
                deleteComment: "אויסמעקן",
                editComment: "רעדאקטירן",
                edited: "באַאַרבעט",
                confirmDelete: "?אויסמעקן דעם מעסעדזש",
                cancel: "באַטל",
                replying: "ענטפערן צו",
                you: "דו",
                messagePlaceholder: "...שרייבט א מעסעדזש",
                justNow: "איצט",
                minutesAgo: "מינוט צוריק",
                hoursAgo: "שעה צוריק",
                daysAgo: "טאג צוריק",
                noComments: "!נאך קיין קאמענטן. זייט דער ערשטער",
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
                { id: 1, type: "travel", time: "9:00 PM", title: {en:"Departure from NY", yi:"מען פליט פון ניו יארק"}, loc: "JFK Airport", query: "JFK Airport Terminal", desc: {en:"Depart on Swiss Air LX15. Shachris on flight if possible.", yi:"מען פליט מיט סוויס ער LX15. שחרית אויפן פליגער אויב מעגליך."} }
            ] },
            { day: "Wed", dateNum: "11", stops: [
                { id: 20, type: "travel", time: "2:05 PM", title: {en:"Arrival Budapest", yi:"אנקומען קיין בודאפעסט"}, loc: "Budapest Airport", query: "Budapest Airport", desc: {en:"Arrival. Mincha at baggage claim. Breakfast/lunch on bus.", yi:"אנקומען. מנחה ביים באגאזש. פרישטאג/מיטאג אויפן באס."} },
                { id: 21, type: "prayer", time: "5:30 PM", title: {en:"Ratzfert Beis Hachaim", yi:"ראצפערט בית החיים"}, loc: {en:"Ratzfert", yi:"ראצפערט"}, query: "Rácalmás Jewish Cemetery, Hungary", desc: {en:"Mikvah, toilets, tfilah at Beis Hachaim.", yi:"מקוה, מתפלל זיין ביים ציון."} },
                { id: 22, type: "prayer", time: "7:00 PM", title: {en:"Kalov Beis Hachaim", yi:"קאלוב בית החיים"}, loc: {en:"Kalov", yi:"קאלוב"}, query: "Nagykálló Jewish Cemetery, Hungary", desc: {en:"tfilah at Beis Hachaim.", yi:"מתפלל זיין ביים ציון."} },
                { id: 23, type: "prayer", time: "8:45 PM", title: {en:"Kerestir", yi:"קערעסטיר"}, loc: {en:"Bodrogkeresztúr", yi:"קערעסטיר"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Maariv, dinner, siyum, historical talk by R' Yaakov Farber.", yi:"מעריב, סעודה, סיום, היסטארישע רעדע דורך ר׳ יעקב פארבער."} },
                { id: 24, type: "hotel", time: "10:25 PM", title: {en:"Hotel Minnaro", yi:"האטעל מינארא"}, loc: {en:"Tokaj", yi:"טאקאי"}, query: "Hotel & Winery & SPA & Restaurant Minnaro Tokaj Hungary", desc: {en:"Check-in. Coffee/tea/snacks available overnight.", yi:"אריינטשעקן. קאווע/טיי/סנעקס דורכאויס די נאכט."} }
            ]},
            { day: "Thu", dateNum: "12", stops: [
                { id: 30, type: "prayer", time: "7:30 AM", title: {en:"Morning in Tokaj", yi:"פרימארגן אין טאקאי"}, loc: {en:"Hotel Minnaro", yi:"האטעל מינארא"}, query: "Hotel & Winery & SPA & Restaurant Minnaro Tokaj Hungary", desc: {en:"Hotel checkout, Mikvah & Shachris. Two buses depart.", yi:"ארויסטשעקן, מקוה און שחרית. צוויי באסן פארן אפ."} },
                { id: 31, type: "prayer", time: "8:45 AM", title: {en:"Kerestir Breakfast", yi:"פרישטאג אין קערעסטיר"}, loc: {en:"Kerestir Shul", yi:"קערעסטירער שול"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Breakfast in shul.", yi:"פרישטאג אין שול."} },
                { id: 32, type: "prayer", time: "10:00 AM", title: {en:"Kerestir Beis Hachaim", yi:"קערעסטירער בית החיים"}, loc: {en:"Reb Shayala's Tziyun", yi:"רבי ישעי׳לעס ציון"}, query: "Reb Shayala's Guest House, Bodrogkeresztúr", desc: {en:"Very important — leaving on time is critical.", yi:"זייער וויכטיג — מען מוז פארן אויף דער צייט."} },
                { id: 33, type: "prayer", time: "11:15 AM", title: {en:"Liska", yi:"ליסקא"}, loc: {en:"Reb Hershele Lisker", yi:"הרה״ק ר׳ הערשעלע ליסקער"}, query: "Olaszliszka Cemetery", desc: {en:"Quick cemetery stop.", yi:"א שנעלער תפלה ביים ציון."} },
                { id: 34, type: "prayer", time: "12:15 PM", title: {en:"Ihel", yi:"אוהעל"}, loc: {en:"Yismach Moshe", yi:"דער הייליגער ישמח משה"}, query: "Sátoraljaújhely Jewish Cemetery", desc: {en:"tfilah at Beis Hachaim. Divrei hisorerus by the Rav.", yi:"מתפלל זיין ביים ציון. דברי התעוררות פונעם רב שליט״א."} },
                { id: 35, type: "prayer", time: "4:30 PM", title: {en:"Tanz", yi:"צאנז"}, loc: {en:"Historic Shul", yi:"היסטארישע שול"}, query: "Nowy Sącz Jewish Cemetery", desc: {en:"Historic shul visit, Mincha, light meal.", yi:"באזוך אין היסטארישע שול, מנחה, לייכטע איבערבייסונג."} },
                { id: 36, type: "hotel", time: "8:15 PM", title: {en:"Krakow Hotel", yi:"קראקא האטעל"}, loc: {en:"Krakow", yi:"קראקא"}, query: "Kazimierz Krakow", desc: {en:"Check-in (remaining for rest of trip).", yi:"אריינטשעקן (מען בלייבט דא פאר דער רעשט פון טריפ)."} },
                { id: 37, type: "prayer", time: "9:15 PM", title: {en:"Maariv & Shiur", yi:"מעריב און שיעור"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Maariv followed by weekly shiur by R' Yoel Lefkowitz.", yi:"מעריב, שיעור דורך ר׳ יואל לעפקאוויטש."} },
                { id: 38, type: "hotel", time: "10:00 PM", title: {en:"Dinner & Kumzitz", yi:"סעודה און קומזיץ"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Main dinner, siyum & kumzitz.", yi:"הויפט סעודה, סיום און קומזיץ."} }
            ]},
            { day: "Fri", dateNum: "13", stops: [
                { id: 40, type: "prayer", time: "8:30 AM", title: {en:"Shachris & Breakfast", yi:"שחרית און פרישטאג"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shachris & breakfast at hotel.", yi:"שחרית און פרישטאג אין האטעל."} },
                { id: 41, type: "prayer", time: "11:10 AM", title: {en:"Krakow Beis Hachaim", yi:"קראקא בית החיים"}, loc: {en:"Rema & Others", yi:"דער רמ״א און אנדערע צדיקים"}, query: "Old Jewish Cemetery, Kraków", desc: {en:"Shul & tfilah at Beis Hachaim with divrei Torah.", yi:"שול און בית החיים באזוך מיט דברי תורה."} },
                { id: 42, type: "travel", time: "12:40 PM", title: {en:"Jewish Quarter Tour", yi:"באזוך אין יידישן קווארטאל"}, loc: {en:"Kazimierz", yi:"קאזימירז"}, query: "Kazimierz, Kraków", desc: {en:"Guided tour of the Jewish Quarter.", yi:"געפירטער באזוך אין יידישן קווארטאל."} },
                { id: 43, type: "hotel", time: "1:40 PM", title: {en:"Shabbos Prep", yi:"שבת צוגרייטונג"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Return to hotel. Shabbos prep, rest, mikvah, shvitz.", yi:"צוריק צום האטעל. שבת צוגרייטונג, זיך צולייגן, מקוה, שוויץ."} },
                { id: 44, type: "shabbos", time: "4:39 PM", title: {en:"Candle Lighting", yi:"ליכט צינדן"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Candle lighting.", yi:"ליכט צינדן."} },
                { id: 45, type: "shabbos", time: "5:30 PM", title: {en:"Shabbos Mincha", yi:"מנחה עש״ק"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shabbos Mincha.", yi:"מנחה ערב שבת קודש."} },
                { id: 46, type: "shabbos", time: "7:00 PM", title: {en:"Shiur", yi:"שיעור"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shiur after Maariv.", yi:"שיעור נאך מעריב."} },
                { id: 47, type: "shabbos", time: "7:30 PM", title: {en:"Shabbos Meal", yi:"שבת סעודה"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Drashos by R' Yoel Lefkowitz & R' Mallach.", yi:"דרשות דורך ר׳ יואל לעפקאוויטש און ר׳ אברהם מרדכי מלאך."} }
            ]},
            { day: "Sat", dateNum: "14", stops: [
                { id: 50, type: "shabbos", time: "Morning", title: {en:"Shabbos Davening", yi:"שחרית שב״ק"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Shachris, kiddush, Shabbos meal.", yi:"שחרית, קידוש, שבת סעודה."} },
                { id: 51, type: "shabbos", time: "5:30 PM", title: {en:"Mincha & Havdalah", yi:"מנחה און הבדלה"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Mincha, drasha, Havdalah.", yi:"מנחה, דרשה, הבדלה."} },
                { id: 52, type: "travel", time: "8:30 PM", title: {en:"Travel to Lizensk", yi:"נסיעה קיין ליזענסק"}, loc: {en:"~90 min drive", yi:"~90 מינוט פארן"}, query: "Leżajsk Beis Hachaim, Poland", desc: {en:"Depart to Lizensk (~90 min after Havdalah).", yi:"פארן קיין ליזענסק (~90 מינוט נאך הבדלה)."} },
                { id: 53, type: "prayer", time: "10:45 PM", title: {en:"Lizensk", yi:"ליזענסק"}, loc: {en:"Rebbe Reb Elimelech", yi:"רבי ר׳ אלימלך"}, query: "Leżajsk Cemetery, Poland", desc: {en:"Melava Malka & tfilah at Beis Hachaim after chatzos.", yi:"מלוה מלכה און באזוך אויפן בית החיים נאך חצות."} },
                { id: 54, type: "travel", time: "3:30 AM", title: {en:"Return to Krakow", yi:"צוריק קיין קראקא"}, loc: {en:"Hotel", yi:"האטעל"}, query: null, desc: {en:"Return to hotel.", yi:"צוריק צום האטעל."} }
            ]},
            { day: "Sun", dateNum: "15", stops: [
                { id: 60, type: "travel", time: "8:45 AM", title: {en:"Hotel Checkout", yi:"ארויסטשעקן"}, loc: {en:"Krakow", yi:"קראקא"}, query: null, desc: {en:"Checkout. Daven & breakfast on bus.", yi:"ארויסטשעקן. דאווענען און פרישטאג אויפן באס."} },
                { id: 61, type: "travel", time: "10:15 AM", title: {en:"Auschwitz", yi:"אוישוויץ"}, loc: {en:"Oswiecim", yi:"אוישוויץ"}, query: "Auschwitz-Birkenau Memorial", desc: {en:"Guided visit with R' Yaakov Farber.", yi:"געפירטער באזוך מיט ר׳ יעקב פארבער."} },
                { id: 62, type: "travel", time: "1:30 PM", title: {en:"Departure from KRK", yi:"אפפליען פון קראקא"}, loc: {en:"KRK Airport", yi:"קראקא לופטפעלד"}, query: "Kraków Airport", desc: {en:"Departure to NY.", yi:"אפפליען קיין ניו יארק."} },
                { id: 63, type: "travel", time: "8:30 PM", title: {en:"Arrival in NY", yi:"אנקומען קיין ניו יארק"}, loc: "JFK Airport", query: "JFK Airport", desc: {en:"Welcome home!", yi:"בעזה״ש צוריק אהיים!"} }
            ]}
        ];

        // Info categories loaded from DB (replaces old hardcoded travelInfo)
        let infoCategories = []; // [{category_id, heading_en, heading_yi, category_sort, items: [{id, text_en, text_yi, sort_order}]}]

        // Packing list loaded from DB (replaces old hardcoded packingList)
        let packingSections = []; // [{section_id, heading_en, heading_yi, items: [{item_id, label_en, label_yi, detail_en, detail_yi, is_locked}]}]

        let currentTab = 'itinerary';
        let checkedItems = new Set();
        let customItems = []; // { item_id, label, section_id }
        let comments = [];
        let replyingTo = null; // { id, user_name, text }
        let lastReadCommentTime = localStorage.getItem('lastReadCommentTime') || '';
        let lastNotifiedCommentTime = localStorage.getItem('lastNotifiedCommentTime') || '';
        let notificationPermissionAsked = false;

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
            document.getElementById('txt-attendance').innerText = t.attendance;
            try { document.getElementById('txt-attendance-desktop').innerText = t.attendance; } catch(e) {}

            // Update user info display for language change
            updateUserInfoDisplay();

            document.getElementById('txt-modal-title').innerText = t.modalTitle;
            document.getElementById('txt-modal-sub').innerText = t.modalSub;
            document.getElementById('txt-save-btn').innerText = t.saveBtn;
            // update RSVP button labels (both mobile and desktop)
            try {
                ['', '-desktop'].forEach(suffix => {
                    const btnYes = document.getElementById('global-going' + suffix);
                    const btnMaybe = document.getElementById('global-maybe' + suffix);
                    const btnNo = document.getElementById('global-no' + suffix);
                    if (btnYes) btnYes.innerText = t.votes?.positive || 'YES';
                    if (btnMaybe) btnMaybe.innerText = t.votes?.neutral || 'MAYBE';
                    if (btnNo) btnNo.innerText = t.votes?.negative || 'NO';
                });
            } catch (e) {}
            
            // Update tab labels
            try {
                document.getElementById('tab-label-itinerary').innerText = t.itinerary;
                document.getElementById('tab-label-info').innerText = t.info;
                document.getElementById('tab-label-packing').innerText = t.packing;
                document.getElementById('tab-label-comments').innerText = t.comments;
            } catch (e) {}

            renderTimeline();
            if (window._attendeesList) renderAttendees(window._attendeesList);
            if (currentTab === 'info') renderInfo();
            if (currentTab === 'packing') renderPackingList();
            if (currentTab === 'comments') renderComments();
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
                // Wrap fetches in individual try-catch to prevent one failure from breaking polling setup
                try { await fetchRsvps(); } catch (e) { console.warn("Could not load RSVPs:", e); }
                try { await fetchPackingData(); } catch (e) { console.warn("Could not load packing data:", e); }
                try { await fetchInfoData(); } catch (e) { console.warn("Could not load info data:", e); }
                try { await fetchChecklist(); } catch (e) { console.warn("Could not load checklist:", e); }
                try { await fetchCustomItems(); } catch (e) { console.warn("Could not load custom items:", e); }
                try { await fetchComments(); } catch (e) { console.warn("Could not load comments:", e); }
                // Re-render current tab now that data is loaded
                if (currentTab === 'info') renderInfo();
                if (currentTab === 'packing') renderPackingList();
                if (currentTab === 'comments') renderComments();
                setupRsvpPolling();
                setupCommentPolling();

                // Request notification permission once on load if not yet decided
                try {
                    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                        Notification.requestPermission();
                    }
                } catch(e) {}

                // Mark comments as read if on comments tab, and update badge
                if (currentTab === 'comments') markCommentsRead();
                updateUnreadBadge();

                // Hide offline badge and show user info
                document.getElementById('offline-badge').classList.add('hidden');
                updateUserInfoDisplay();
            } catch (e) {
                console.warn("Switching to Offline Mode:", e.message);
                isOffline = true;
                document.getElementById('offline-badge').classList.remove('hidden');
                // Hide sync link buttons when offline
                document.querySelectorAll('[onclick="copyAuthLink()"]').forEach(el => el.classList.add('hidden'));

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

                // Admin: fetch all users with data counts
                if (isAdmin) {
                    try {
                        const adminRes = await fetch(`${API_BASE}/api/admin/users`);
                        if (adminRes.ok) {
                            const allUsers = await adminRes.json();
                            window._adminUserMap = {};
                            (allUsers || []).forEach(u => { window._adminUserMap[u.uid] = u; });
                        }
                    } catch (e) { console.error('Admin users fetch error:', e); }
                }

                renderAttendees(list || []);
                const my = (list || []).find(r => r.uid === currentUser.uid);
                currentStatus = my ? my.status : null;
                updateVoteButtons(currentStatus);
            } catch (err) {
                console.error("Fetch RSVPs error:", err);
            }
        }

        function setupRsvpPolling() {
            if (isOffline) return;
            // Poll every 10 seconds for updates
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = setInterval(fetchRsvps, 10000);
        }

        function setupCommentPolling() {
            if (isOffline) return;
            // Poll every 8 seconds for comment updates
            if (commentPollInterval) clearInterval(commentPollInterval);
            commentPollInterval = setInterval(fetchComments, 8000);
        }

        function launchConfetti() {
            const rsvpBox = isDesktop() ? document.getElementById('rsvp-box-desktop') : document.getElementById('rsvp-box');
            if (!rsvpBox || typeof confetti !== 'function') return;
            const rect = rsvpBox.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            confetti({ particleCount: 80, spread: 70, origin: { x, y }, colors: ['#6366f1','#a78bfa','#f59e0b','#34d399','#f472b6','#60a5fa'] });
            setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { x: x - 0.1, y }, colors: ['#fbbf24','#fb7185','#6366f1','#34d399'] }), 150);
            setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { x: x + 0.1, y }, colors: ['#a78bfa','#60a5fa','#f59e0b','#f472b6'] }), 300);
        }

        window.handleVote = async (status) => {
            const wasGoing = currentStatus === 'going';
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

            if (currentStatus === 'going' && !wasGoing) launchConfetti();

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
                    if (pendingVote === 'going') launchConfetti();
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
                        if (pendingVote === 'going') launchConfetti();
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
            const enterBtn = document.getElementById('enter-name-btn');
            const editBtn = document.getElementById('txt-edit-name');

            // Sidebar user info
            const sidebarContainer = document.getElementById('user-info-sidebar');
            const sidebarName = document.getElementById('user-display-name-sidebar');
            const sidebarAdmin = document.getElementById('admin-badge-sidebar');
            const sidebarEnterBtn = document.getElementById('enter-name-btn-sidebar');
            const sidebarEditBtn = document.getElementById('txt-edit-name-sidebar');

            const t = i18n[currentLang];

            if (userData && userData.name) {
                // User has a name - show name + inline edit icon
                if (nameDisplay) nameDisplay.innerText = userData.name;
                if (container) { container.classList.remove('hidden'); container.classList.add('flex'); }
                if (enterBtn) enterBtn.classList.add('hidden');

                if (sidebarName) sidebarName.innerText = userData.name;
                if (sidebarContainer) { sidebarContainer.classList.remove('hidden'); sidebarContainer.style.display = 'flex'; }
                if (sidebarEnterBtn) sidebarEnterBtn.classList.add('hidden');

                if (isAdmin) {
                    if (adminBadge) adminBadge.classList.remove('hidden');
                    if (sidebarAdmin) sidebarAdmin.classList.remove('hidden');
                } else {
                    if (adminBadge) adminBadge.classList.add('hidden');
                    if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
                }
            } else {
                // No name yet - hide user info, show "Enter Name" button
                if (container) { container.classList.add('hidden'); container.classList.remove('flex'); }
                if (enterBtn) enterBtn.classList.remove('hidden');
                if (editBtn) editBtn.innerText = t.editName;

                if (sidebarContainer) { sidebarContainer.classList.add('hidden'); }
                if (sidebarEnterBtn) sidebarEnterBtn.classList.remove('hidden');
                if (sidebarEditBtn) sidebarEditBtn.innerText = t.editName;
            }
        }

        window.openAdmin = (uid, name) => {
            if (isOffline) return;
            if (!isAdmin) return;
            currentAdminTarget = { uid, name };
            document.getElementById('admin-target-name').innerText = name || 'No name';
            document.getElementById('admin-target-uid').innerText = uid;

            // Populate data summary from admin user map
            const userData = window._adminUserMap ? window._adminUserMap[uid] : null;
            const summaryEl = document.getElementById('admin-data-summary');
            if (summaryEl && userData) {
                const parts = [];
                if (userData.rsvp_status) parts.push(`RSVP: ${userData.rsvp_status}`);
                else parts.push('No RSVP');
                if (userData.checklist_count > 0) parts.push(`${userData.checklist_count} checklist`);
                if (userData.custom_items_count > 0) parts.push(`${userData.custom_items_count} custom items`);
                if (userData.comments_count > 0) parts.push(`${userData.comments_count} comments`);
                summaryEl.innerText = parts.join(' · ');
                summaryEl.classList.remove('hidden');
            } else if (summaryEl) {
                summaryEl.classList.add('hidden');
            }

            // Reset to main view (not delete confirmation or edit name)
            document.getElementById('admin-main-view').classList.remove('hidden');
            document.getElementById('admin-delete-confirm').classList.add('hidden');
            document.getElementById('admin-edit-name-row').classList.add('hidden');

            document.getElementById('admin-modal').classList.add('active');
        };

        window.showAdminEditName = () => {
            const row = document.getElementById('admin-edit-name-row');
            const input = document.getElementById('admin-name-input');
            row.classList.toggle('hidden');
            if (!row.classList.contains('hidden')) {
                input.value = currentAdminTarget.name || '';
                input.focus();
            }
        };

        window.adminSaveName = async () => {
            if (!currentAdminTarget || isOffline) return;
            const newName = document.getElementById('admin-name-input').value.trim();
            if (!newName) return;
            try {
                const res = await fetch(`${API_BASE}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentAdminTarget.uid, name: newName })
                });
                if (!res.ok) throw new Error('Failed to update name');
                // Also update RSVP name if they have one
                const userData = window._adminUserMap ? window._adminUserMap[currentAdminTarget.uid] : null;
                if (userData && userData.rsvp_status) {
                    const initials = newName.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2);
                    await fetch(`${API_BASE}/api/rsvps`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: currentAdminTarget.uid, name: newName, initials, status: userData.rsvp_status })
                    });
                }
                currentAdminTarget.name = newName;
                document.getElementById('admin-target-name').innerText = newName;
                document.getElementById('admin-edit-name-row').classList.add('hidden');
                showStatusBar('Name updated');
                await fetchRsvps();
            } catch (err) {
                console.error('Admin save name error:', err);
                showStatusBar('Error updating name');
            }
        };

        window.adminUpdateStatus = async (status) => {
            if (!currentAdminTarget || isOffline) return;
            await saveVote(currentAdminTarget.uid, currentAdminTarget.name, status);
            document.getElementById('admin-modal').classList.remove('active');
        };

        window.showDeleteConfirm = () => {
            if (!currentAdminTarget) return;
            const userData = window._adminUserMap ? window._adminUserMap[currentAdminTarget.uid] : null;
            const warningEl = document.getElementById('admin-delete-warning');
            if (warningEl && userData) {
                const items = [];
                if (userData.rsvp_status) items.push('RSVP status');
                if (userData.checklist_count > 0) items.push(`${userData.checklist_count} checklist items`);
                if (userData.custom_items_count > 0) items.push(`${userData.custom_items_count} custom items`);
                if (userData.comments_count > 0) items.push(`${userData.comments_count} comments`);
                const dataStr = items.length > 0 ? items.join(', ') : 'no data';
                warningEl.innerText = `Permanently delete "${currentAdminTarget.name || 'this user'}"? This will remove: ${dataStr}. This cannot be undone.`;
            }
            document.getElementById('admin-main-view').classList.add('hidden');
            document.getElementById('admin-delete-confirm').classList.remove('hidden');
        };

        window.cancelDeleteUser = () => {
            document.getElementById('admin-main-view').classList.remove('hidden');
            document.getElementById('admin-delete-confirm').classList.add('hidden');
        };

        window.confirmDeleteUser = async () => {
            if (!currentAdminTarget || isOffline) return;
            try {
                const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(currentAdminTarget.uid)}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete user');
                document.getElementById('admin-modal').classList.remove('active');
                showStatusBar('User deleted');
                await fetchRsvps();
            } catch (err) {
                console.error('Delete user error:', err);
                showStatusBar('Error deleting user');
            }
        };

        function updateVoteButtons(status) {
            // Update both mobile/tablet and desktop RSVP buttons
            ['going', 'maybe', 'no'].forEach(s => {
                const activeClass = "flex-1 py-3 rounded-2xl text-[11px] font-extrabold rsvp-active";
                const defaultClass = "flex-1 py-3 rounded-2xl text-[11px] font-extrabold border border-white/10 text-indigo-100 transition-all";
                const btn = document.getElementById(`global-${s}`);
                if (btn) btn.className = s === status ? activeClass : defaultClass;
                const btnDesktop = document.getElementById(`global-${s}-desktop`);
                if (btnDesktop) btnDesktop.className = s === status ? activeClass : defaultClass;
            });

            // Add or remove glow animation based on vote status
            ['rsvp-box', 'rsvp-box-desktop'].forEach(id => {
                const box = document.getElementById(id);
                if (box) {
                    if (status === null || status === undefined) {
                        box.classList.add('rsvp-glow');
                    } else {
                        box.classList.remove('rsvp-glow');
                    }
                }
            });
        }

        function renderAttendees(list) {
            window._attendeesList = list || [];
            const container = document.getElementById('attendees-list');
            const goingCount = list.filter(a => a.status === 'going').length;
            const t = i18n[currentLang];
            const countLabel = `${goingCount} ${t.joined}`;

            // Update mobile count
            const mobileCount = document.getElementById('attendee-count');
            if (mobileCount) mobileCount.innerText = countLabel;

            // Update sidebar count
            const sidebarCount = document.getElementById('attendee-count-sidebar');
            if (sidebarCount) sidebarCount.innerText = countLabel;

            // Filter out users with no status (for non-admin)
            let activeList = list.filter(a => a.status);

            // Admin: merge in users without RSVP from the admin user map
            if (isAdmin && window._adminUserMap) {
                const rsvpUids = new Set(list.map(a => a.uid));
                const noRsvpUsers = Object.values(window._adminUserMap)
                    .filter(u => !rsvpUids.has(u.uid) || !list.find(a => a.uid === u.uid && a.status))
                    .map(u => ({
                        uid: u.uid,
                        name: u.name || u.uid.substring(0, 8),
                        initials: u.name ? u.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2) : '??',
                        status: u.rsvp_status || null,
                        _noRsvp: !u.rsvp_status
                    }));
                // Add those not already in activeList
                noRsvpUsers.forEach(u => {
                    if (!activeList.find(a => a.uid === u.uid)) activeList.push(u);
                });
            }

            // Mobile attendees list (dark header background)
            const itemsHtml = activeList.map(a => {
                const dimmed = a._noRsvp ? 'opacity-40' : '';
                const statusDot = a.status === 'going' ? 'bg-emerald-400' : (a.status === 'no' ? 'bg-rose-400' : (a.status === 'maybe' ? 'bg-white/40' : 'bg-slate-500'));
                return `
                <div onclick="openAdmin('${escapeHtml(a.uid)}', '${escapeHtml(a.name)}')" class="flex items-center gap-1.5 bg-white/10 ps-0.5 pe-2.5 py-0.5 rounded-full cursor-pointer hover:bg-white/20 active:scale-95 transition-all ${dimmed}">
                    <div class="w-6 h-6 rounded-full ${a._noRsvp ? 'bg-slate-500' : 'bg-indigo-400'} text-white flex items-center justify-center text-[8px] font-bold">${escapeHtml(a.initials)}</div>
                    <span class="text-[10px] font-bold text-indigo-100">${escapeHtml(a.name)}</span>
                    <div class="w-1.5 h-1.5 rounded-full ${statusDot}"></div>
                </div>`;
            }).join('');

            if (container) {
                // Preserve expand/collapse state across re-renders
                const wasExpanded = container.getAttribute('data-collapsed') === 'false';

                // Replace only the pill content, not the fade element
                const fade = document.getElementById('attendees-fade');
                container.innerHTML = itemsHtml;

                // Re-add or create fade element
                if (fade) {
                    container.appendChild(fade);
                } else {
                    const newFade = document.createElement('div');
                    newFade.id = 'attendees-fade';
                    newFade.className = 'absolute left-0 right-0 bottom-0 h-8 pointer-events-none transition-opacity duration-300 z-20';
                    newFade.style.background = 'linear-gradient(to bottom, transparent, #1e1b4b)';
                    container.appendChild(newFade);
                }

                // Restore previous state
                const currentFade = document.getElementById('attendees-fade');
                if (wasExpanded) {
                    container.style.maxHeight = 'none';
                    container.setAttribute('data-collapsed', 'false');
                    if (currentFade) currentFade.style.opacity = '0';
                } else {
                    container.style.maxHeight = '3.5rem';
                    container.setAttribute('data-collapsed', 'true');
                    if (currentFade) currentFade.style.opacity = '1';
                }
            }

            // Sidebar attendees (desktop)
            const sidebarList = document.getElementById('sidebar-attendees-list');
            if (sidebarList) {
                sidebarList.innerHTML = activeList.map(a => {
                    const dimmed = a._noRsvp ? 'opacity-40' : '';
                    const statusDot = a.status === 'going' ? 'bg-emerald-400' : (a.status === 'no' ? 'bg-rose-400' : (a.status === 'maybe' ? 'bg-white/40' : 'bg-slate-500'));
                    return `
                    <div onclick="openAdmin('${escapeHtml(a.uid)}', '${escapeHtml(a.name)}')" class="flex items-center gap-1 bg-white/10 ps-0.5 pe-2 py-0.5 rounded-full cursor-pointer hover:bg-white/20 transition-colors ${dimmed}">
                        <div class="w-5 h-5 rounded-full ${a._noRsvp ? 'bg-slate-500' : 'bg-indigo-400'} text-white flex items-center justify-center text-[7px] font-bold">${escapeHtml(a.initials)}</div>
                        <span class="text-[9px] font-bold text-indigo-100">${escapeHtml(a.name)}</span>
                        <div class="w-1.5 h-1.5 rounded-full ${statusDot}"></div>
                    </div>`;
                }).join('');
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
                const text = document.getElementById('reveal-text'); if (text) text.innerText = i18n[currentLang].showMore;
                const icon = document.getElementById('reveal-icon'); if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                container.setAttribute('data-collapsed','false');
                container.style.maxHeight = 'none';
                const fade = document.getElementById('attendees-fade'); if (fade) fade.style.opacity = '0';
                const text = document.getElementById('reveal-text'); if (text) text.innerText = i18n[currentLang].showLessNames;
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
            if (text) text.innerText = i18n[currentLang].showLessNames;
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            // Collapse
            container.style.maxHeight = '3.5rem';
            container.setAttribute('data-collapsed', 'true');
            if (fade) fade.style.opacity = '1';
            if (text) text.innerText = i18n[currentLang].showMore;
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
                            
                            const safeQuery = encodeURIComponent(s.query).replace(/'/g, '%27');
                            const safeTitle = encodeURIComponent(s.title[currentLang]).replace(/'/g, '%27');
                            const dirLink = hasQuery ? `
                                        <a href="https://www.google.com/maps/search/?api=1&query=${safeQuery}"
                                           onclick="return handleDirectionsClick(event, '${safeQuery}', '${safeTitle}', ${s.id})"
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
            const lang = currentLang;

            const categoriesHtml = infoCategories.map(cat => {
                const heading = (lang === 'yi' ? cat.heading_yi : cat.heading_en) || cat.heading_en || cat.heading_yi;
                const sortedItems = cat.items.sort((a, b) => a.sort_order - b.sort_order);

                const itemsHtml = sortedItems.map(item => {
                    const text = (lang === 'yi' ? item.text_yi : item.text_en) || item.text_en || item.text_yi;
                    const editIcon = isAdmin ? `<button onclick="event.stopPropagation(); startEditInfoItem('${item.id}')" class="flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-colors p-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>` : '';
                    const deleteIcon = isAdmin ? `<button onclick="event.stopPropagation(); adminDeleteInfoItem('${item.id}')" class="flex-shrink-0 text-slate-300 hover:text-rose-500 transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : '';
                    const dragHandle = isAdmin ? `<span class="drag-handle info-drag-handle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></span>` : '';

                    return `<li class="flex items-start gap-2 text-xs text-slate-600 group" data-item-id="${item.id}">
                        ${dragHandle}
                        <span class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                        <span class="flex-1" id="info-item-text-${item.id}">${escapeHtml(text)}</span>
                        ${isAdmin ? `<span class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">${editIcon}${deleteIcon}</span>` : ''}
                    </li>`;
                }).join('');

                const categoryDragHandle = isAdmin ? `<span class="drag-handle info-category-drag-handle mr-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></span>` : '';
                const editCategoryIcon = isAdmin ? `<button onclick="event.stopPropagation(); startEditInfoCategory('${cat.category_id}')" class="flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-colors p-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>` : '';
                const deleteCategoryIcon = isAdmin ? `<button onclick="event.stopPropagation(); adminDeleteInfoCategory('${cat.category_id}')" class="flex-shrink-0 text-slate-300 hover:text-rose-500 transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : '';

                const addItemPh = lang === 'yi' ? 'צולייגן א נייע זאך...' : 'Add new item...';
                const addItemSection = isAdmin ? `
                    <div class="mt-3 pt-3 border-t border-slate-100">
                        <div class="flex items-start gap-2">
                            <textarea id="add-info-input-${cat.category_id}" rows="2" placeholder="${addItemPh}" ${lang === 'yi' ? 'dir="rtl"' : ''} class="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 resize-none focus:border-indigo-400 focus:outline-none" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); adminAddInfoItem('${cat.category_id}')}"></textarea>
                            <button onclick="adminAddInfoItem('${cat.category_id}')" class="self-start mt-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">+ ${lang === 'yi' ? 'צולייגן' : 'Add'}</button>
                        </div>
                    </div>
                ` : '';

                return `
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4" style="break-inside:avoid" data-category-id="${cat.category_id}">
                        <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center group" id="info-category-heading-${cat.category_id}">
                            ${categoryDragHandle}
                            <span class="flex-1">${escapeHtml(heading)}</span>
                            ${isAdmin ? `<span class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">${editCategoryIcon}${deleteCategoryIcon}</span>` : ''}
                        </h3>
                        <ul id="info-sortable-${cat.category_id}" class="space-y-2" data-category-id="${cat.category_id}">
                            ${itemsHtml}
                        </ul>
                        ${addItemSection}
                    </div>
                `;
            }).join('');

            const addCatPh = lang === 'yi' ? 'נאמען פון קאטעגאריע...' : 'Category name...';
            const addCategorySection = isAdmin ? `
                <div class="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 shadow-sm mb-4" style="break-inside:avoid">
                    <h3 class="text-sm font-bold text-indigo-700 mb-3">${lang === 'yi' ? 'צולייגן א נייע קאטעגאריע' : 'Add New Category'}</h3>
                    <div class="flex items-center gap-2">
                        <input id="add-info-category" type="text" placeholder="${addCatPh}" ${lang === 'yi' ? 'dir="rtl"' : ''} class="flex-1 text-xs bg-white border border-indigo-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" onkeydown="if(event.key==='Enter') adminAddInfoCategory()">
                        <button onclick="adminAddInfoCategory()" class="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-white hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">+ ${lang === 'yi' ? 'צולייגן' : 'Add'}</button>
                    </div>
                </div>
            ` : '';

            container.innerHTML = `<div id="info-categories-sortable" class="masonry-grid">${categoriesHtml}${addCategorySection}</div>`;
            initInfoSortable();
        }

        async function fetchPackingData() {
            if (isOffline) return;
            try {
                const res = await fetch(`${API_BASE}/api/packing`);
                if (!res.ok) return;
                const rows = await res.json();
                // Group rows by section
                const sectionMap = {};
                (rows || []).forEach(r => {
                    if (!sectionMap[r.section_id]) {
                        sectionMap[r.section_id] = {
                            section_id: r.section_id,
                            heading_en: r.heading_en,
                            heading_yi: r.heading_yi,
                            section_sort: r.section_sort,
                            items: []
                        };
                    }
                    if (r.item_id) {
                        sectionMap[r.section_id].items.push({
                            id: r.item_id,
                            label_en: r.label_en,
                            label_yi: r.label_yi,
                            detail_en: r.detail_en,
                            detail_yi: r.detail_yi,
                            locked: r.is_locked === 1,
                            sort_order: r.sort_order
                        });
                    }
                });
                packingSections = Object.values(sectionMap).sort((a, b) => a.section_sort - b.section_sort);
            } catch (e) {
                console.warn("Could not load packing data:", e);
            }
        }

        async function fetchInfoData() {
            if (isOffline) return;
            try {
                const res = await fetch(`${API_BASE}/api/info`);
                if (!res.ok) return;
                const rows = await res.json();
                const catMap = {};
                (rows || []).forEach(r => {
                    if (!catMap[r.category_id]) {
                        catMap[r.category_id] = {
                            category_id: r.category_id,
                            heading_en: r.heading_en,
                            heading_yi: r.heading_yi,
                            category_sort: r.category_sort,
                            items: []
                        };
                    }
                    if (r.item_id) {
                        catMap[r.category_id].items.push({
                            id: r.item_id,
                            text_en: r.text_en,
                            text_yi: r.text_yi,
                            sort_order: r.sort_order
                        });
                    }
                });
                infoCategories = Object.values(catMap).sort((a, b) => a.category_sort - b.category_sort);
            } catch (e) {
                console.warn("Could not load info data:", e);
            }
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

        async function fetchCustomItems() {
            if (isOffline || !currentUser) return;
            try {
                const res = await fetch(`${API_BASE}/api/custom-items/${currentUser.uid}`);
                if (!res.ok) return;
                customItems = (await res.json()) || [];
                customItems.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            } catch (e) {
                console.warn("Could not load custom items:", e);
            }
        }

        async function fetchComments() {
            if (isOffline) return;
            try {
                const res = await fetch(`${API_BASE}/api/comments`);
                if (!res.ok) throw new Error('Failed to fetch comments');
                const newComments = await res.json();
                const prevCount = comments.length;
                comments = newComments;
                if (currentTab === 'comments') {
                    renderComments(prevCount === 0);
                    markCommentsRead();
                } else {
                    updateUnreadBadge();
                }
                checkNewNotifications(prevCount);
            } catch (e) {
                console.warn("Could not load comments:", e);
            }
        }

        function markCommentsRead() {
            if (comments.length > 0) {
                lastReadCommentTime = comments[0].created_at; // comments are sorted DESC, [0] is newest
                localStorage.setItem('lastReadCommentTime', lastReadCommentTime);
            }
            updateUnreadBadge();
        }

        function getUnreadCount() {
            if (!lastReadCommentTime) return comments.length;
            return comments.filter(c => c.created_at > lastReadCommentTime).length;
        }

        function updateUnreadBadge() {
            const count = getUnreadCount();
            const btn = document.getElementById('tab-btn-comments');
            if (!btn) return;
            let badge = document.getElementById('comments-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.id = 'comments-badge';
                    badge.className = 'comments-unread-badge';
                    btn.style.position = 'relative';
                    btn.appendChild(badge);
                }
                badge.innerText = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                if (badge) badge.classList.add('hidden');
            }
        }

        function checkNewNotifications(prevCount) {
            if (!currentUser || !userData || !userData.name) return;
            if (prevCount === 0) return; // Don't notify on first load

            // Only check comments newer than what we last notified about
            const cutoff = lastNotifiedCommentTime || lastReadCommentTime;
            const newOnes = comments.filter(c => c.created_at > cutoff && c.uid !== currentUser.uid);
            if (newOnes.length === 0) return;

            const myName = userData.name;
            for (const c of newOnes) {
                const isMention = c.comment_text && c.comment_text.includes('@' + myName);
                const isReplyToMe = c.reply_to && comments.find(p => p.id === c.reply_to && p.uid === currentUser.uid);
                if (isMention || isReplyToMe) {
                    const label = isMention ? (c.user_name + ' mentioned you') : (c.user_name + ' replied to you');

                    // Update last notified time so we don't re-trigger
                    lastNotifiedCommentTime = c.created_at;
                    localStorage.setItem('lastNotifiedCommentTime', lastNotifiedCommentTime);

                    // Show persistent toast
                    showChatNotification(label, c.id);

                    // Browser notification (only if already granted, never prompt)
                    try {
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            new Notification('Mekomos Chat', { body: label, icon: './images/ohr-eliezer-white.svg' });
                        }
                    } catch(e) {}

                    break; // One notification per cycle
                }
            }

            // Update last notified time to prevent re-checking old comments
            if (newOnes.length > 0 && !lastNotifiedCommentTime) {
                lastNotifiedCommentTime = newOnes[0].created_at;
                localStorage.setItem('lastNotifiedCommentTime', lastNotifiedCommentTime);
            }
        }

        function showChatNotification(message, commentId) {
            // Remove any existing notification
            const existing = document.getElementById('chat-notification');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'chat-notification';
            toast.className = 'chat-notification';
            toast.innerHTML = '<div class="flex items-center gap-3 min-w-0">'
                + '<div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">'
                + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
                + '</div>'
                + '<p class="text-sm font-bold text-slate-800 truncate">' + message + '</p>'
                + '</div>'
                + '<div class="flex items-center gap-2 flex-shrink-0">'
                + '<button onclick="openChatNotification(\'' + (commentId || '') + '\')" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Open</button>'
                + '<button onclick="dismissChatNotification()" class="text-slate-400 hover:text-slate-600 p-1">'
                + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                + '</button>'
                + '</div>';
            document.body.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => toast.classList.add('chat-notification-visible'));
        }

        window.openChatNotification = function(commentId) {
            dismissChatNotification();
            switchTab('comments');
            if (commentId) {
                setTimeout(() => scrollToComment(commentId), 300);
            }
        };

        window.dismissChatNotification = function() {
            const toast = document.getElementById('chat-notification');
            if (toast) {
                toast.classList.remove('chat-notification-visible');
                setTimeout(() => toast.remove(), 300);
            }
        };

        window.submitComment = async function() {
            const input = document.getElementById('comment-input');
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            if (!userData || !userData.name) {
                openNameModal();
                return;
            }
            if (isOffline) {
                showStatusBar("Cannot post comments offline");
                return;
            }
            const commentId = 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            try {
                const body = { id: commentId, uid: currentUser.uid, user_name: userData.name, comment_text: text };
                if (replyingTo) body.reply_to = replyingTo.id;
                const res = await fetch(`${API_BASE}/api/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!res.ok) throw new Error('Failed to post comment');
                input.value = '';
                input.style.height = 'auto';
                cancelReply();
                await fetchComments();
                // Force scroll to bottom after own post
                const list = document.getElementById('comments-list');
                if (list) list.scrollTop = list.scrollHeight;
                markCommentsRead();
            } catch (e) {
                console.error("Post comment error:", e);
                showStatusBar("Error posting comment");
            }
        };

        window.deleteComment = async function(commentId, commentUid) {
            if (!isAdmin && commentUid !== currentUser.uid) return;
            if (isOffline) { showStatusBar("Cannot delete comments offline"); return; }
            // Show confirm dialog
            const overlay = document.getElementById('chat-confirm-overlay');
            if (overlay) {
                overlay.dataset.commentId = commentId;
                overlay.classList.remove('hidden');
                return;
            }
        };

        window.confirmDeleteComment = async function() {
            const overlay = document.getElementById('chat-confirm-overlay');
            if (!overlay) return;
            const commentId = overlay.dataset.commentId;
            overlay.classList.add('hidden');
            try {
                const res = await fetch(`${API_BASE}/api/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete comment');
                await fetchComments();
            } catch (e) {
                console.error("Delete comment error:", e);
                showStatusBar("Error deleting comment");
            }
        };

        window.cancelDeleteComment = function() {
            const overlay = document.getElementById('chat-confirm-overlay');
            if (overlay) overlay.classList.add('hidden');
        };

        window.setReply = function(commentId, userName, text) {
            replyingTo = { id: commentId, user_name: userName, text: text };
            const indicator = document.getElementById('reply-indicator');
            const nameEl = document.getElementById('reply-to-name');
            const textEl = document.getElementById('reply-to-text');
            if (indicator) indicator.classList.remove('hidden');
            if (nameEl) nameEl.innerText = userName;
            if (textEl) textEl.innerText = text.length > 60 ? text.substring(0, 60) + '...' : text;
            document.getElementById('comment-input').focus();
        };

        window.cancelReply = function() {
            replyingTo = null;
            const indicator = document.getElementById('reply-indicator');
            if (indicator) indicator.classList.add('hidden');
        };

        window.editComment = function(commentId, currentText) {
            const el = document.getElementById('comment-' + commentId);
            if (!el) return;
            const bubble = el.querySelector('.chat-bubble-own') || el.querySelector('.chat-bubble-other');
            if (!bubble) return;
            const textP = bubble.querySelector('.chat-msg-text');
            if (!textP) return;
            const original = currentText;
            textP.outerHTML = '<div class="chat-edit-wrap"><textarea class="chat-edit-input w-full text-sm bg-white/20 border border-white/30 rounded-lg px-2 py-1 focus:outline-none resize-none" rows="2">' + escapeHtml(original) + '</textarea><div class="flex gap-2 mt-1"><button onclick="saveEdit(\'' + escapeHtml(commentId) + '\')" class="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded hover:bg-white/30">Save</button><button onclick="fetchComments()" class="text-[9px] font-bold opacity-60 hover:opacity-100">Cancel</button></div></div>';
            const textarea = bubble.querySelector('.chat-edit-input');
            if (textarea) { textarea.focus(); textarea.selectionStart = textarea.value.length; }
        };

        window.saveEdit = async function(commentId) {
            const el = document.getElementById('comment-' + commentId);
            if (!el) return;
            const textarea = el.querySelector('.chat-edit-input');
            if (!textarea) return;
            const newText = textarea.value.trim();
            if (!newText) return;
            if (isOffline) { showStatusBar("Cannot edit comments offline"); return; }
            try {
                const res = await fetch(`${API_BASE}/api/comments/${encodeURIComponent(commentId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUser.uid, comment_text: newText })
                });
                if (!res.ok) throw new Error('Failed to edit comment');
                await fetchComments();
            } catch (e) {
                console.error("Edit comment error:", e);
                showStatusBar("Error editing comment");
            }
        };

        function getRelativeTime(timestamp) {
            const t = i18n[currentLang];
            const now = new Date();
            const past = new Date(timestamp + 'Z');
            const diffMs = now - past;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1) return t.justNow;
            if (diffMins < 60) return diffMins + ' ' + t.minutesAgo;
            if (diffHours < 24) return diffHours + ' ' + t.hoursAgo;
            return diffDays + ' ' + t.daysAgo;
        }

        function renderMentions(text) {
            const escaped = escapeHtml(text);
            const names = (window._attendeesList || []).map(a => a.name).filter(Boolean);
            // Sort by length descending so longer names match first
            names.sort((a, b) => b.length - a.length);
            let result = escaped;
            names.forEach(name => {
                const escapedName = escapeHtml(name);
                const regex = new RegExp('@' + escapedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                result = result.replace(regex, '<span class="chat-mention">@' + escapedName + '</span>');
            });
            // Fallback: highlight any remaining @word patterns
            result = result.replace(/@(\S+)/g, function(match) {
                if (match.includes('chat-mention')) return match;
                return '<span class="chat-mention">' + match + '</span>';
            });
            return result;
        }

        function renderComments(scrollToBottom) {
            const container = document.getElementById('comments-list');
            if (!container) return;
            const t = i18n[currentLang];

            // Update input placeholder
            const input = document.getElementById('comment-input');
            if (input) input.placeholder = t.commentPlaceholder;

            if (!comments || comments.length === 0) {
                container.innerHTML = '<div class="flex flex-col items-center justify-center h-full opacity-50"><svg class="mb-3 text-slate-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><p class="text-xs text-slate-400 font-bold">' + escapeHtml(t.noComments) + '</p></div>';
                return;
            }

            // Build a map for reply lookups
            const commentMap = {};
            comments.forEach(c => { commentMap[c.id] = c; });

            // Reverse to show oldest first (chat style)
            const sorted = [...comments].reverse();

            let html = '';
            let lastDate = '';

            sorted.forEach(c => {
                const isOwner = currentUser && c.uid === currentUser.uid;
                const canDelete = isAdmin || isOwner;

                // Convert UTC to local time
                let timeStr = '';
                let localDate = '';
                if (c.created_at) {
                    const utc = new Date(c.created_at + 'Z');
                    timeStr = utc.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    localDate = utc.toLocaleDateString('en-CA'); // YYYY-MM-DD format
                }

                // Date separator
                const msgDate = localDate;
                if (msgDate && msgDate !== lastDate) {
                    lastDate = msgDate;
                    const dateObj = new Date(msgDate + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    let dateLabel = msgDate;
                    if (dateObj.toDateString() === today.toDateString()) dateLabel = 'Today';
                    else if (dateObj.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';
                    html += '<div class="flex justify-center my-3"><span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">' + dateLabel + '</span></div>';
                }

                // Reply preview - build two versions for own and other messages
                let replyHtmlOwn = '';
                let replyHtmlOther = '';
                if (c.reply_to && commentMap[c.reply_to]) {
                    const parent = commentMap[c.reply_to];
                    const parentText = escapeHtml(parent.comment_text.length > 50 ? parent.comment_text.substring(0, 50) + '...' : parent.comment_text);
                    const parentName = escapeHtml(parent.user_name);
                    const onclick = 'onclick="scrollToComment(\'' + escapeHtml(parent.id) + '\')"';
                    replyHtmlOwn = '<div class="mb-1.5 px-3 py-1.5 rounded-lg bg-white/15 border-l-2 border-indigo-200 cursor-pointer" ' + onclick + '>'
                        + '<p class="text-[9px] font-bold text-indigo-200">' + parentName + '</p>'
                        + '<p class="text-[10px] text-indigo-100/70 truncate">' + parentText + '</p></div>';
                    replyHtmlOther = '<div class="mb-1.5 px-3 py-1.5 rounded-lg bg-black/5 border-l-2 border-indigo-400 cursor-pointer" ' + onclick + '>'
                        + '<p class="text-[9px] font-bold text-indigo-600">' + parentName + '</p>'
                        + '<p class="text-[10px] text-slate-500 truncate">' + parentText + '</p></div>';
                }

                // Delete button
                const deleteBtn = canDelete ? ' <button onclick="event.stopPropagation();deleteComment(\'' + escapeHtml(c.id) + '\',\'' + escapeHtml(c.uid) + '\')" class="chat-delete-btn text-slate-300 hover:text-rose-500 transition-colors opacity-0" title="' + escapeHtml(t.deleteComment) + '"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' : '';
                const editBtn = isOwner ? ' <button onclick="event.stopPropagation();editComment(\'' + escapeHtml(c.id) + '\',\'' + escapeHtml(c.comment_text.replace(/'/g, "\\'").replace(/\n/g, "\\n")) + '\')" class="chat-edit-btn text-slate-300 hover:text-indigo-500 transition-colors opacity-0" title="' + escapeHtml(t.editComment) + '"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' : '';

                // Reply button
                const replyBtn = '<button onclick="setReply(\'' + escapeHtml(c.id) + '\',\'' + escapeHtml(c.user_name) + '\',\'' + escapeHtml(c.comment_text.replace(/'/g, "\\'")) + '\')" class="chat-reply-btn text-slate-300 hover:text-indigo-500 transition-colors opacity-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg></button>';

                if (isOwner) {
                    // Own messages - right aligned, indigo bubble
                    html += '<div class="flex justify-end group mb-1" id="comment-' + escapeHtml(c.id) + '">'
                        + '<div class="flex items-end gap-1.5">'
                        + deleteBtn + editBtn + replyBtn
                        + '<div class="chat-bubble-own max-w-[75%] rounded-2xl rounded-br-md px-3.5 py-2">'
                        + replyHtmlOwn
                        + '<p class="chat-msg-text text-sm text-white leading-relaxed whitespace-pre-wrap">' + renderMentions(c.comment_text) + '</p>'
                        + '<p class="text-[9px] text-indigo-200 mt-1 text-right">' + (c.edited_at ? '<span class="italic opacity-70">' + escapeHtml(t.edited) + ' </span>' : '') + timeStr + '</p>'
                        + '</div></div></div>';
                } else {
                    // Others' messages - left aligned, white/gray bubble
                    html += '<div class="flex justify-start group mb-1" id="comment-' + escapeHtml(c.id) + '">'
                        + '<div class="flex items-end gap-1.5">'
                        + '<div class="chat-bubble-other max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2">'
                        + '<p class="text-[10px] font-bold text-indigo-600 mb-0.5">' + escapeHtml(c.user_name) + '</p>'
                        + replyHtmlOther
                        + '<p class="chat-msg-text text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">' + renderMentions(c.comment_text) + '</p>'
                        + '<p class="text-[9px] text-slate-400 mt-1">' + (c.edited_at ? '<span class="italic opacity-70">' + escapeHtml(t.edited) + ' </span>' : '') + timeStr + '</p>'
                        + '</div>'
                        + replyBtn + deleteBtn
                        + '</div></div>';
                }
            });

            container.innerHTML = html;

            // Smart scroll: only scroll to bottom if explicitly requested or user is near bottom
            if (scrollToBottom) {
                container.scrollTop = container.scrollHeight;
            } else {
                // Auto-scroll only if user is near the bottom (within 100px)
                const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (nearBottom) container.scrollTop = container.scrollHeight;
            }
        }

        window.scrollToComment = function(commentId) {
            const el = document.getElementById('comment-' + commentId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'background 0.3s';
                el.style.background = 'rgba(99,102,241,0.08)';
                setTimeout(() => { el.style.background = 'transparent'; }, 1500);
            }
        };

        // Mention/tag system
        let mentionActive = false;
        let mentionQuery = '';
        let mentionStart = -1;
        let mentionIndex = 0;

        function getMentionCandidates(query) {
            const list = window._attendeesList || [];
            if (!query) return list.slice(0, 5);
            const q = query.toLowerCase();
            return list.filter(a => a.name && a.name.toLowerCase().includes(q)).slice(0, 5);
        }

        function showMentionDropdown(candidates) {
            let dropdown = document.getElementById('mention-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'mention-dropdown';
                dropdown.className = 'mention-dropdown';
                const inputBar = document.getElementById('chat-input-bar');
                if (inputBar) inputBar.appendChild(dropdown);
            }
            if (candidates.length === 0) {
                dropdown.classList.add('hidden');
                return;
            }
            mentionIndex = 0;
            dropdown.innerHTML = candidates.map((c, i) =>
                '<div class="mention-option' + (i === 0 ? ' mention-active' : '') + '" data-name="' + escapeHtml(c.name) + '" onmousedown="selectMention(\'' + escapeHtml(c.name.replace(/'/g, "\\'")) + '\')">' + escapeHtml(c.name) + '</div>'
            ).join('');
            dropdown.classList.remove('hidden');
        }

        function hideMentionDropdown() {
            const dropdown = document.getElementById('mention-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
            mentionActive = false;
        }

        window.selectMention = function(name) {
            const input = document.getElementById('comment-input');
            if (!input) return;
            const val = input.value;
            const before = val.substring(0, mentionStart);
            const after = val.substring(input.selectionStart);
            input.value = before + '@' + name + ' ' + after;
            input.focus();
            const pos = before.length + name.length + 2;
            input.selectionStart = pos;
            input.selectionEnd = pos;
            hideMentionDropdown();
        };

        window.addCustomItem = async function() {
            const input = document.getElementById('add-input-custom');
            if (!input) return;
            const label = input.value.trim();
            if (!label) return;
            const detailInput = document.getElementById('add-detail-custom');
            const detail = detailInput ? detailInput.value.trim() : '';
            const itemId = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            const sortOrder = customItems.length;
            customItems.push({ item_id: itemId, label, section_id: 'custom', detail: detail || null, sort_order: sortOrder });
            input.value = '';
            if (detailInput) detailInput.value = '';
            renderPackingList();
            if (!isOffline && currentUser) {
                try {
                    await fetch(`${API_BASE}/api/custom-items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: currentUser.uid, item_id: itemId, label, section_id: 'custom', detail: detail || null, sort_order: sortOrder })
                    });
                } catch (e) { console.error("Save custom item error:", e); }
            }
        };

        window.deleteCustomItem = async function(itemId) {
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const msg = lang === 'yi' ? 'אויסמעקן דעם זאך? דאס קען נישט צוריקגעדרייט ווערן.' : 'Delete this item? This cannot be undone.';
            if (!confirm(msg)) return;
            customItems = customItems.filter(i => i.item_id !== itemId);
            checkedItems.delete(itemId);
            renderPackingList();
            if (!isOffline && currentUser) {
                try {
                    await fetch(`${API_BASE}/api/custom-items/${currentUser.uid}/${encodeURIComponent(itemId)}`, {
                        method: 'DELETE'
                    });
                } catch (e) { console.error("Delete custom item error:", e); }
            }
        };

        window.toggleDetailInput = function(sectionId) {
            const input = document.getElementById(`add-input-${sectionId}`);
            const detailRow = document.getElementById(`detail-row-${sectionId}`);
            if (!input || !detailRow) return;
            if (input.value.trim()) {
                detailRow.classList.remove('hidden');
            } else {
                detailRow.classList.add('hidden');
            }
        };

        // ── Drag-and-drop (SortableJS) ──
        let sortableInstances = [];

        function initSortable() {
            sortableInstances.forEach(s => s.destroy());
            sortableInstances = [];
            if (typeof Sortable === 'undefined') return;

            // Admin: sortable built-in sections
            if (isAdmin) {
                packingSections.forEach(section => {
                    const el = document.getElementById(`sortable-${section.section_id}`);
                    if (!el) return;
                    const inst = new Sortable(el, {
                        handle: '.drag-handle',
                        delay: 300,
                        delayOnTouchOnly: true,
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        chosenClass: 'sortable-chosen',
                        filter: '.text-slate-400', // skip empty-state <li>
                        onEnd: function(evt) { handleBuiltinReorder(section.section_id, evt); }
                    });
                    sortableInstances.push(inst);
                });
            }

            // All users: sortable custom items
            if (currentUser) {
                const customEl = document.getElementById('sortable-custom');
                if (customEl && customItems.length > 0) {
                    const inst = new Sortable(customEl, {
                        handle: '.drag-handle',
                        delay: 300,
                        delayOnTouchOnly: true,
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        chosenClass: 'sortable-chosen',
                        onEnd: function(evt) { handleCustomReorder(evt); }
                    });
                    sortableInstances.push(inst);
                }
            }
        }

        async function handleBuiltinReorder(sectionId, evt) {
            const section = packingSections.find(s => s.section_id === sectionId);
            if (!section || evt.oldIndex === evt.newIndex) return;
            const [moved] = section.items.splice(evt.oldIndex, 1);
            section.items.splice(evt.newIndex, 0, moved);
            const payload = section.items.map((item, idx) => ({ item_id: item.id, sort_order: idx }));
            try {
                const res = await fetch(`${API_BASE}/api/packing/items/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: payload })
                });
                if (!res.ok) throw new Error('Reorder failed');
            } catch (e) {
                console.error('Reorder error:', e);
                showStatusBar('Error saving order');
                await fetchPackingData();
                renderPackingList();
            }
        }

        async function handleCustomReorder(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const [moved] = customItems.splice(evt.oldIndex, 1);
            customItems.splice(evt.newIndex, 0, moved);
            const payload = customItems.map((item, idx) => ({ item_id: item.item_id, sort_order: idx }));
            if (!isOffline && currentUser) {
                try {
                    const res = await fetch(`${API_BASE}/api/custom-items/${currentUser.uid}/reorder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: payload })
                    });
                    if (!res.ok) throw new Error('Reorder failed');
                } catch (e) {
                    console.error('Custom reorder error:', e);
                    showStatusBar('Error saving order');
                    await fetchCustomItems();
                    renderPackingList();
                }
            }
        }

        // ── Inline editing ──
        window.startEditItem = function(itemId, editType) {
            const li = document.querySelector(`[data-item-id="${itemId}"]`);
            if (!li) return;
            if (editType === 'admin') {
                startEditBuiltinItem(itemId, li);
            } else {
                startEditCustomItem(itemId, li);
            }
        };

        function startEditCustomItem(itemId, li) {
            const ci = customItems.find(i => i.item_id === itemId);
            if (!ci) return;
            const labelDiv = li.querySelector('.flex-1.min-w-0');
            if (!labelDiv) return;
            li.removeAttribute('onclick');
            li.classList.remove('cursor-pointer');
            li.classList.add('cursor-default');
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const detailPh = lang === 'yi' ? 'דעטאלן (אפציאנאל)...' : 'Details (optional)...';
            labelDiv.innerHTML = `
                <input type="text" class="w-full text-xs bg-white border border-indigo-300 rounded px-2 py-1 mb-1" value="${escapeHtml(ci.label)}" data-field="label" />
                <input type="text" class="w-full text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-500" value="${escapeHtml(ci.detail || '')}" placeholder="${detailPh}" data-field="detail" />
            `;
            const labelInput = labelDiv.querySelector('[data-field="label"]');
            const detailInput = labelDiv.querySelector('[data-field="detail"]');
            labelInput.focus();
            labelInput.select();

            const saveEdit = async () => {
                const newLabel = labelInput.value.trim();
                const newDetail = detailInput.value.trim();
                if (!newLabel) { renderPackingList(); return; }
                ci.label = newLabel;
                ci.detail = newDetail || null;
                renderPackingList();
                if (!isOffline && currentUser) {
                    try {
                        await fetch(`${API_BASE}/api/custom-items/${currentUser.uid}/${encodeURIComponent(itemId)}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ label: newLabel, detail: newDetail || null })
                        });
                    } catch (e) {
                        console.error('Edit custom item error:', e);
                        showStatusBar('Error saving edit');
                    }
                }
            };
            const cancelEdit = () => { renderPackingList(); };
            const keyHandler = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            };
            labelInput.addEventListener('keydown', keyHandler);
            detailInput.addEventListener('keydown', keyHandler);
            let blurTimeout;
            const handleBlur = () => { blurTimeout = setTimeout(() => { if (document.activeElement === labelInput || document.activeElement === detailInput) return; saveEdit(); }, 150); };
            const handleFocus = () => { clearTimeout(blurTimeout); };
            labelInput.addEventListener('blur', handleBlur);
            detailInput.addEventListener('blur', handleBlur);
            labelInput.addEventListener('focus', handleFocus);
            detailInput.addEventListener('focus', handleFocus);
        }

        function startEditBuiltinItem(itemId, li) {
            let rawItem = null;
            for (const section of packingSections) {
                rawItem = section.items.find(i => i.id === itemId);
                if (rawItem) break;
            }
            if (!rawItem) return;
            const labelDiv = li.querySelector('.flex-1.min-w-0');
            if (!labelDiv) return;
            li.removeAttribute('onclick');
            li.classList.remove('cursor-pointer');
            li.classList.add('cursor-default');
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const labelKey = lang === 'yi' ? 'label_yi' : 'label_en';
            const detailKey = lang === 'yi' ? 'detail_yi' : 'detail_en';
            const curLabel = rawItem[labelKey] || rawItem.label_en || rawItem.label_yi;
            const curDetail = rawItem[detailKey] || rawItem.detail_en || rawItem.detail_yi || '';
            const detailPh = lang === 'yi' ? 'דעטאלן (אפציאנאל)...' : 'Details (optional)...';
            labelDiv.innerHTML = `
                <input type="text" class="w-full text-xs bg-white border border-indigo-300 rounded px-2 py-1 mb-1" value="${escapeHtml(curLabel)}" data-field="label" ${lang === 'yi' ? 'dir="rtl"' : ''} />
                <input type="text" class="w-full text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-500" value="${escapeHtml(curDetail)}" placeholder="${detailPh}" data-field="detail" ${lang === 'yi' ? 'dir="rtl"' : ''} />
            `;
            const labelInput = labelDiv.querySelector('[data-field="label"]');
            const detailInput = labelDiv.querySelector('[data-field="detail"]');
            labelInput.focus();
            labelInput.select();
            const allInputs = labelDiv.querySelectorAll('input');

            const saveEdit = async () => {
                const newLabel = labelInput.value.trim();
                const newDetail = detailInput.value.trim();
                if (!newLabel) { renderPackingList(); return; }
                rawItem[labelKey] = newLabel;
                rawItem[detailKey] = newDetail || null;
                renderPackingList();
                const body = {};
                body[labelKey] = newLabel;
                body[detailKey] = newDetail || null;
                try {
                    const res = await fetch(`${API_BASE}/api/packing/items/${encodeURIComponent(itemId)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) throw new Error('Update failed');
                    showStatusBar('Item updated');
                } catch (e) {
                    console.error('Admin edit item error:', e);
                    showStatusBar('Error updating item');
                    await fetchPackingData();
                    renderPackingList();
                }
            };
            const cancelEdit = () => { renderPackingList(); };
            allInputs.forEach(input => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                });
            });
            let blurTimeout;
            allInputs.forEach(input => {
                input.addEventListener('blur', () => { blurTimeout = setTimeout(() => { if ([...allInputs].includes(document.activeElement)) return; saveEdit(); }, 150); });
                input.addEventListener('focus', () => { clearTimeout(blurTimeout); });
            });
        }

        window.adminAddPackingItem = async function(sectionId) {
            const input = document.getElementById(`add-input-${sectionId}`);
            const detailInput = document.getElementById(`add-detail-${sectionId}`);
            if (!input) return;
            const label = input.value.trim();
            if (!label) return;
            const detail = detailInput ? detailInput.value.trim() : '';
            const itemId = sectionId + '_' + Date.now();
            try {
                const res = await fetch(`${API_BASE}/api/packing/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_id: itemId, section_id: sectionId, label_en: label, label_yi: label, detail_en: detail || null, detail_yi: detail || null, sort_order: 999 })
                });
                if (!res.ok) throw new Error('Failed to add item');
                input.value = '';
                if (detailInput) detailInput.value = '';
                await fetchPackingData();
                renderPackingList();
                showStatusBar('Item added');
            } catch (e) {
                console.error("Admin add packing item error:", e);
                showStatusBar('Error adding item');
            }
        };

        window.adminDeletePackingItem = async function(itemId) {
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const msg = lang === 'yi' ? 'אויסמעקן דעם זאך פאר אלע באנוצער? דאס קען נישט צוריקגעדרייט ווערן.' : 'Remove this item for all users? This cannot be undone.';
            if (!confirm(msg)) return;
            try {
                const res = await fetch(`${API_BASE}/api/packing/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete item');
                checkedItems.delete(itemId);
                await fetchPackingData();
                renderPackingList();
                showStatusBar('Item removed');
            } catch (e) {
                console.error("Admin delete packing item error:", e);
                showStatusBar('Error removing item');
            }
        };

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

        function renderCheckItem(item, deleteType, options) {
            // deleteType: 'custom' for user custom items, 'admin' for admin-deletable global items, falsy for none
            // options: { draggable, editable }
            const opts = options || {};
            const isLocked = item.locked === true;
            const checked = isLocked || checkedItems.has(item.id);
            const detailMarkup = item.detail ? `<span class="check-info-wrap"><svg class="check-info-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span class="check-inline-detail">${escapeHtml(item.detail)}</span></span>` : '';
            const dragHandle = opts.draggable ? `<div class="drag-handle" title="Drag to reorder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></div>` : '';
            const editBtn = opts.editable ? `<button onclick="event.stopPropagation(); startEditItem('${item.id}', '${deleteType || ''}')" class="flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-colors p-0.5" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>` : '';
            let deleteBtn = '';
            if (deleteType === 'custom') {
                deleteBtn = `<button onclick="event.stopPropagation(); deleteCustomItem('${item.id}')" class="custom-item-delete flex-shrink-0 text-slate-300 hover:text-rose-500 transition-colors" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
            } else if (deleteType === 'admin') {
                deleteBtn = `<button onclick="event.stopPropagation(); adminDeletePackingItem('${item.id}')" class="custom-item-delete flex-shrink-0 text-slate-300 hover:text-rose-500 transition-colors" title="Remove item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
            }
            return `
            <li class="check-item flex items-center gap-2 ${isLocked ? 'opacity-60 cursor-default' : 'cursor-pointer'} select-none" data-item-id="${item.id}" ${isLocked ? '' : `onclick="toggleCheckItem('${item.id}')"`}>
                ${dragHandle}
                <div class="check-box ${checked ? 'checked' : ''}">
                    ${checked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <span class="text-xs ${checked ? 'line-through text-slate-400' : 'text-slate-700'}">${escapeHtml(item.label)}</span>${detailMarkup}
                </div>
                ${editBtn}
                ${deleteBtn}
            </li>`;
        }

        function renderPackingList() {
            const container = document.getElementById('packing-container');
            if (!container) return;
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const customHeading = lang === 'yi' ? 'מיינע זאכן (פריווייט)' : 'My Items (private)';
            const addPlaceholder = lang === 'yi' ? 'צולייגן א זאך...' : 'Add item...';

            const builtInHtml = packingSections.map(section => {
                const heading = lang === 'yi' ? section.heading_yi : section.heading_en;
                const itemsHtml = section.items.map(dbItem => {
                    const item = {
                        id: dbItem.id,
                        label: (lang === 'yi' ? dbItem.label_yi : dbItem.label_en) || dbItem.label_en || dbItem.label_yi,
                        detail: (lang === 'yi' ? dbItem.detail_yi : dbItem.detail_en) || dbItem.detail_en || dbItem.detail_yi,
                        locked: dbItem.locked
                    };
                    const delType = (isAdmin && !dbItem.locked) ? 'admin' : false;
                    const itemOpts = {
                        draggable: isAdmin && !dbItem.locked,
                        editable: isAdmin && !dbItem.locked
                    };
                    return renderCheckItem(item, delType, itemOpts);
                }).join('');
                const detailPlaceholder = lang === 'yi' ? 'דעטאלן (אפציאנאל)...' : 'Details (optional)...';
                const adminAddHtml = isAdmin ? `
                    <div class="mt-3">
                        <div class="flex items-center gap-2">
                            <input id="add-input-${section.section_id}" type="text" placeholder="${addPlaceholder}" class="add-item-input flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" oninput="toggleDetailInput('${section.section_id}')" onkeydown="if(event.key==='Enter'){event.preventDefault(); document.getElementById('add-detail-${section.section_id}').focus();}">
                            <button onclick="adminAddPackingItem('${section.section_id}')" class="add-item-btn text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">+ Add</button>
                        </div>
                        <div id="detail-row-${section.section_id}" class="hidden mt-1.5">
                            <input id="add-detail-${section.section_id}" type="text" placeholder="${detailPlaceholder}" class="add-item-input w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none text-slate-500" onkeydown="if(event.key==='Enter') adminAddPackingItem('${section.section_id}')">
                        </div>
                    </div>` : '';
                return `
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-bold text-slate-800 mb-3">${escapeHtml(heading)}</h3>
                    <ul id="sortable-${section.section_id}" class="space-y-2" data-section-id="${section.section_id}">${itemsHtml}</ul>
                    ${adminAddHtml}
                </div>`;
            }).join('');

            const detailPlaceholderCustom = lang === 'yi' ? 'דעטאלן (אפציאנאל)...' : 'Details (optional)...';
            const customHtml = `
                <div class="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm">
                    <h3 class="text-sm font-bold text-indigo-700 mb-3">${escapeHtml(customHeading)}</h3>
                    <ul id="sortable-custom" class="space-y-2" data-section-id="custom">
                        ${customItems.length ? customItems.map(ci => renderCheckItem({ id: ci.item_id, label: ci.label, detail: ci.detail || null }, 'custom', { draggable: true, editable: true })).join('') : `<li class="text-[11px] text-slate-400 py-1">${lang === 'yi' ? 'נאך נישט צוגעלייגט' : 'No custom items yet'}</li>`}
                    </ul>
                    <div class="mt-3">
                        <div class="flex items-center gap-2">
                            <input id="add-input-custom" type="text" placeholder="${addPlaceholder}" class="add-item-input flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" oninput="toggleDetailInput('custom')" onkeydown="if(event.key==='Enter'){event.preventDefault(); document.getElementById('add-detail-custom').focus();}">
                            <button onclick="addCustomItem()" class="add-item-btn text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">+ Add</button>
                        </div>
                        <div id="detail-row-custom" class="hidden mt-1.5">
                            <input id="add-detail-custom" type="text" placeholder="${detailPlaceholderCustom}" class="add-item-input w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none text-slate-500" onkeydown="if(event.key==='Enter') addCustomItem()">
                        </div>
                    </div>
                </div>`;
            container.innerHTML = builtInHtml + customHtml;
            initSortable();
        }

        // ── Info (Travel Info) Admin Functions ──

        window.adminAddInfoItem = async function(categoryId) {
            const input = document.getElementById(`add-info-input-${categoryId}`);
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const textEn = lang === 'en' ? text : text;
            const textYi = lang === 'yi' ? text : text;
            const itemId = categoryId + '_' + Date.now();
            try {
                const res = await fetch(`${API_BASE}/api/info/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_id: itemId, category_id: categoryId, text_en: textEn, text_yi: textYi, sort_order: 999 })
                });
                if (!res.ok) throw new Error('Failed to add info item');
                input.value = '';
                await fetchInfoData();
                renderInfo();
                showStatusBar('Info item added');
            } catch (e) {
                console.error("Admin add info item error:", e);
                showStatusBar('Error adding info item');
            }
        };

        window.adminDeleteInfoItem = async function(itemId) {
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const msg = lang === 'yi' ? 'אויסמעקן דעם זאך פאר אלע באנוצער? דאס קען נישט צוריקגעדרייט ווערן.' : 'Delete this item for all users? This cannot be undone.';
            if (!confirm(msg)) return;
            try {
                const res = await fetch(`${API_BASE}/api/info/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete info item');
                await fetchInfoData();
                renderInfo();
                showStatusBar('Info item deleted');
            } catch (e) {
                console.error("Admin delete info item error:", e);
                showStatusBar('Error deleting info item');
            }
        };

        window.startEditInfoItem = function(itemId) {
            let item = null;
            for (const cat of infoCategories) {
                const found = cat.items.find(i => i.id === itemId);
                if (found) { item = found; break; }
            }
            if (!item) return;
            const textSpan = document.getElementById(`info-item-text-${itemId}`);
            if (!textSpan) return;
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const textKey = lang === 'yi' ? 'text_yi' : 'text_en';
            const curText = item[textKey] || item.text_en || item.text_yi;
            textSpan.innerHTML = `<textarea rows="1" class="w-full text-xs bg-white border border-indigo-300 rounded px-2 py-1.5 overflow-hidden" data-field="text" ${lang === 'yi' ? 'dir="rtl"' : ''}>${escapeHtml(curText)}</textarea>`;
            const textarea = textSpan.querySelector('textarea');

            // Auto-resize textarea to fit content
            const autoResize = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };
            requestAnimationFrame(autoResize);
            textarea.addEventListener('input', autoResize);

            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            const saveEdit = async () => {
                const newText = textarea.value.trim();
                if (!newText) { renderInfo(); return; }
                item[textKey] = newText;
                renderInfo();
                const body = {};
                body[textKey] = newText;
                try {
                    const res = await fetch(`${API_BASE}/api/info/items/${encodeURIComponent(itemId)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) throw new Error('Update failed');
                    showStatusBar('Info item updated');
                } catch (e) {
                    console.error('Admin edit info item error:', e);
                    showStatusBar('Error updating info item');
                    await fetchInfoData();
                    renderInfo();
                }
            };
            let cancelled = false;
            const cancelEdit = () => { cancelled = true; renderInfo(); };
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            });
            textarea.addEventListener('blur', () => { setTimeout(() => { if (!cancelled) saveEdit(); }, 150); });
        };

        window.startEditInfoCategory = function(categoryId) {
            const category = infoCategories.find(c => c.category_id === categoryId);
            if (!category) return;
            const headingEl = document.getElementById(`info-category-heading-${categoryId}`);
            if (!headingEl) return;
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const headingKey = lang === 'yi' ? 'heading_yi' : 'heading_en';
            const curHeading = category[headingKey] || category.heading_en || category.heading_yi;
            headingEl.innerHTML = `<input type="text" class="flex-1 text-sm font-bold bg-white border border-indigo-300 rounded px-2 py-1" value="${escapeHtml(curHeading)}" data-field="heading" ${lang === 'yi' ? 'dir="rtl"' : ''} />`;
            const input = headingEl.querySelector('input');
            input.focus();
            input.select();
            const saveEdit = async () => {
                const newHeading = input.value.trim();
                if (!newHeading) { renderInfo(); return; }
                category[headingKey] = newHeading;
                renderInfo();
                const body = {};
                body[headingKey] = newHeading;
                try {
                    const res = await fetch(`${API_BASE}/api/info/categories/${encodeURIComponent(categoryId)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) throw new Error('Update failed');
                    showStatusBar('Category updated');
                } catch (e) {
                    console.error('Admin edit info category error:', e);
                    showStatusBar('Error updating category');
                    await fetchInfoData();
                    renderInfo();
                }
            };
            let cancelled = false;
            const cancelEdit = () => { cancelled = true; renderInfo(); };
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            });
            input.addEventListener('blur', () => { setTimeout(() => { if (!cancelled) saveEdit(); }, 150); });
        };

        window.adminDeleteInfoCategory = async function(categoryId) {
            const lang = currentLang === 'yi' ? 'yi' : 'en';
            const msg = lang === 'yi' ? 'אויסמעקן די גאנצע קאטעגאריע און אלע איטעמס? דאס קען נישט צוריקגעדרייט ווערן.' : 'Delete this entire category and all its items? This cannot be undone.';
            if (!confirm(msg)) return;
            try {
                const res = await fetch(`${API_BASE}/api/info/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete info category');
                await fetchInfoData();
                renderInfo();
                showStatusBar('Category deleted');
            } catch (e) {
                console.error("Admin delete info category error:", e);
                showStatusBar('Error deleting category');
            }
        };

        window.adminAddInfoCategory = async function() {
            const input = document.getElementById('add-info-category');
            if (!input) return;
            const heading = input.value.trim();
            if (!heading) return;
            const categoryId = 'cat_' + Date.now();
            try {
                const res = await fetch(`${API_BASE}/api/info/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category_id: categoryId, heading_en: heading, heading_yi: heading, sort_order: 999 })
                });
                if (!res.ok) throw new Error('Failed to add info category');
                input.value = '';
                await fetchInfoData();
                renderInfo();
                showStatusBar('Category added');
            } catch (e) {
                console.error("Admin add info category error:", e);
                showStatusBar('Error adding category');
            }
        };

        // ── Info Drag-and-drop (SortableJS) ──
        let infoSortableInstances = [];

        function initInfoSortable() {
            infoSortableInstances.forEach(s => s.destroy());
            infoSortableInstances = [];
            if (typeof Sortable === 'undefined' || !isAdmin) return;

            infoCategories.forEach(cat => {
                const el = document.getElementById(`info-sortable-${cat.category_id}`);
                if (!el) return;
                const inst = new Sortable(el, {
                    handle: '.info-drag-handle',
                    delay: 300,
                    delayOnTouchOnly: true,
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    onEnd: function(evt) { handleInfoReorder(cat.category_id, evt); }
                });
                infoSortableInstances.push(inst);
            });

            // Category-level drag and drop
            const categoriesContainer = document.getElementById('info-categories-sortable');
            if (categoriesContainer) {
                const catInst = new Sortable(categoriesContainer, {
                    handle: '.info-category-drag-handle',
                    draggable: '[data-category-id]',
                    delay: 300,
                    delayOnTouchOnly: true,
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    onEnd: function(evt) { handleInfoCategoryReorder(evt); }
                });
                infoSortableInstances.push(catInst);
            }
        }

        async function handleInfoReorder(categoryId, evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const cat = infoCategories.find(c => c.category_id === categoryId);
            if (!cat) return;
            const [moved] = cat.items.splice(evt.oldIndex, 1);
            cat.items.splice(evt.newIndex, 0, moved);
            const payload = cat.items.map((item, idx) => ({ item_id: item.id, sort_order: idx }));
            try {
                const res = await fetch(`${API_BASE}/api/info/items/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: payload })
                });
                if (!res.ok) throw new Error('Reorder failed');
            } catch (e) {
                console.error('Info reorder error:', e);
                showStatusBar('Error saving order');
                await fetchInfoData();
                renderInfo();
            }
        }

        async function handleInfoCategoryReorder(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const [moved] = infoCategories.splice(evt.oldIndex, 1);
            infoCategories.splice(evt.newIndex, 0, moved);
            const payload = infoCategories.map((cat, idx) => ({ category_id: cat.category_id, sort_order: idx }));
            try {
                const res = await fetch(`${API_BASE}/api/info/categories/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categories: payload })
                });
                if (!res.ok) throw new Error('Category reorder failed');
            } catch (e) {
                console.error('Info category reorder error:', e);
                showStatusBar('Error saving category order');
                await fetchInfoData();
                renderInfo();
            }
        }

        const tabRoutes = { itinerary: 'itinerary', info: 'info', packing: 'packing', comments: 'comments' };

        window.switchTab = function(tab, pushHash = true) {
            if (!tabRoutes[tab]) tab = 'itinerary';
            currentTab = tab;
            const tabs = ['itinerary', 'info', 'packing', 'comments'];
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
            if (tab === 'comments') { renderComments(); markCommentsRead(); dismissChatNotification(); }
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
                    if (text) text.innerText = i18n[currentLang].showMore;
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    const isCollapsed = container && container.getAttribute('data-collapsed') === 'true';
                    if (isCollapsed) {
                        if (text) text.innerText = i18n[currentLang].showMore;
                        if (icon) icon.style.transform = 'rotate(0deg)';
                        if (fade) fade.style.opacity = '1';
                    } else {
                        if (text) text.innerText = i18n[currentLang].showLessNames;
                        if (icon) icon.style.transform = 'rotate(180deg)';
                        if (fade) fade.style.opacity = '0';
                    }
                }
            } catch (e) {}

            // Add Enter key to submit comments (Shift+Enter for new line) and handle mention navigation
            document.addEventListener('keydown', function(e) {
                if (document.activeElement && document.activeElement.id === 'comment-input') {
                    if (mentionActive) {
                        const dropdown = document.getElementById('mention-dropdown');
                        const options = dropdown ? dropdown.querySelectorAll('.mention-option') : [];
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            mentionIndex = Math.min(mentionIndex + 1, options.length - 1);
                            options.forEach((o, i) => o.classList.toggle('mention-active', i === mentionIndex));
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            mentionIndex = Math.max(mentionIndex - 1, 0);
                            options.forEach((o, i) => o.classList.toggle('mention-active', i === mentionIndex));
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            if (options[mentionIndex]) {
                                selectMention(options[mentionIndex].dataset.name);
                            }
                        } else if (e.key === 'Escape') {
                            hideMentionDropdown();
                        }
                        return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitComment();
                    }
                }
            });

            // Handle @ detection for mentions
            document.addEventListener('input', function(e) {
                if (e.target.id !== 'comment-input') return;
                const input = e.target;
                const val = input.value;
                const pos = input.selectionStart;
                // Look backward from cursor for @
                const textBefore = val.substring(0, pos);
                const atIndex = textBefore.lastIndexOf('@');
                if (atIndex >= 0 && (atIndex === 0 || textBefore[atIndex - 1] === ' ' || textBefore[atIndex - 1] === '\n')) {
                    const query = textBefore.substring(atIndex + 1);
                    if (!query.includes(' ') && !query.includes('\n')) {
                        mentionActive = true;
                        mentionStart = atIndex;
                        mentionQuery = query;
                        const candidates = getMentionCandidates(query);
                        showMentionDropdown(candidates);
                        return;
                    }
                }
                hideMentionDropdown();
            });

            // Route to tab from URL hash
            const initialTab = getTabFromHash();
            if (initialTab !== 'itinerary') {
                switchTab(initialTab, false);
            }

            init();
        };