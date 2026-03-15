const { useState, useEffect, useRef, useMemo } = React;

const AnimatedNumber = ({ value, decimals = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        let start = displayValue;
        const end = parseFloat(value) || 0;
        if (start === end) return;
        const duration = 1000;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(start + (end - start) * ease);
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplayValue(end);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <>{displayValue.toFixed(decimals)}</>;
};

const RadarChart = ({ data }) => {
    const tags = Object.entries(data).filter(([_, stat]) => stat.cDone > 0).map(([tag]) => tag);
    if (tags.length < 3) return <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">방사형 차트는 과목이 3개 이상일 때 표시됩니다.<br/>(현재 {tags.length}개)</div>;

    const size = 220;
    const center = size / 2;
    const radius = 70;
    const angleStep = (Math.PI * 2) / tags.length;

    const getCoordinates = (value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return [x, y];
    };

    const studentPoints = tags.map((tag, i) => {
        const stat = data[tag];
        const rate = stat.sTotal > 0 ? (stat.sDone / stat.sTotal) * 100 : 0;
        return getCoordinates(rate, i).join(',');
    }).join(' ');

    const classPoints = tags.map((tag, i) => {
        const stat = data[tag];
        const rate = stat.cTotal > 0 ? (stat.cDone / stat.cTotal) * 100 : 0;
        return getCoordinates(rate, i).join(',');
    }).join(' ');

    return (
        <div className="flex flex-col items-center py-2">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                <defs>
                    <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2"/>
                    </linearGradient>
                    <linearGradient id="classGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1"/>
                    </linearGradient>
                </defs>
                {[20, 40, 60, 80, 100].map((level, idx) => (
                    <polygon key={idx} points={tags.map((_, i) => getCoordinates(level, i).join(',')).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
                ))}
                {tags.map((tag, i) => {
                    const [lx, ly] = getCoordinates(100, i);
                    const [tx, ty] = getCoordinates(120, i);
                    return (
                        <g key={i}>
                            <line x1={center} y1={center} x2={lx} y2={ly} stroke="#e2e8f0" strokeWidth="1" />
                            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#64748b" className="font-bold">{tag}</text>
                        </g>
                    );
                })}
                <polygon points={classPoints} fill="url(#classGrad)" stroke="#cbd5e1" strokeWidth="2" />
                <polygon points={studentPoints} fill="url(#studentGrad)" stroke="#818cf8" strokeWidth="3" />
                {tags.map((tag, i) => {
                        const stat = data[tag];
                        const sRate = stat.sTotal > 0 ? (stat.sDone / stat.sTotal) * 100 : 0;
                        const [sx, sy] = getCoordinates(sRate, i);
                        return <circle key={`s-${i}`} cx={sx} cy={sy} r="4" fill="#818cf8" />;
                })}
            </svg>
            <div className="flex gap-4 mt-2 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div><span className="text-slate-600 font-bold">나</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div><span className="text-slate-400 font-bold">학급 평균</span></div>
            </div>
        </div>
    );
};

const GRASS_THEMES = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-400', ring: 'ring-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-400', ring: 'ring-rose-300', text: 'text-rose-700', dot: 'bg-rose-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-400', ring: 'ring-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-50', border: 'border-green-400', ring: 'ring-green-300', text: 'text-green-700', dot: 'bg-green-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-400', ring: 'ring-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-400', ring: 'ring-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' },
    slate: { bg: 'bg-slate-100', border: 'border-slate-400', ring: 'ring-slate-300', text: 'text-slate-700', dot: 'bg-slate-500' },
};

const renderTextWithLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline break-all" onClick={(e) => e.stopPropagation()}>{part}</a>;
        }
        return part;
    });
};

const StatsGrassModal = ({ isOpen, onClose, student: propStudent, students, records: propRecords, dates, dailyTasks: propDailyTasks, onSaveCounseling, onSaveStickers, onSaveStickerWithNote, showToast, openConfirm, appConfig, apiKey, onSaveRecordDraft, isLocalMode, db, appId, setStudents, setRecords, setDailyTasks, saveData, isPortfolioMode, onSwitchStudent, onPhotoUpload, onSaveTaskComment, initialShowScoreAnalysis = false }) => {
    // [실시간 연동] 부모로부터 받은 props(propRecords, propDailyTasks, propStudent)를 직접 사용합니다.
    // 아래 useEffect 훅이 부모의 state를 직접 업데이트하므로, 이 컴포넌트 내의 별도 state는 더 이상 필요 없습니다.
    const records = propRecords || {};
    const dailyTasks = propDailyTasks || {};
    const student = propStudent;

    if (!isOpen || !student || !student.history) return null;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            
            const tagName = e.target.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) return;

            if (!students || !student || !onSwitchStudent) return;
            const currentIndex = students.findIndex(s => s.id === student.id);
            if (e.key === 'ArrowLeft' && currentIndex > 0) onSwitchStudent(students[currentIndex - 1].id);
            if (e.key === 'ArrowRight' && currentIndex >= 0 && currentIndex < students.length - 1) onSwitchStudent(students[currentIndex + 1].id);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, student, students, onSwitchStudent]);

    const [notes, setNotes] = useState([]);
    const [stickerCount, setStickerCount] = useState(student.stickers || 0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearchCal, setShowSearchCal] = useState(false);
    const [calMonth, setCalMonth] = useState(dayjs());
    
    // [New] 과제별 메모 모아보기 데이터 가공
    const taskComments = useMemo(() => {
        const collected = [];
        if (!student || !records || !dailyTasks) return collected;
        
        Object.entries(records).forEach(([date, r]) => {
            const sRec = r[student.id];
            if (sRec && sRec.taskComments) {
                const tasks = dailyTasks[date] || [];
                Object.entries(sRec.taskComments).forEach(([idx, comment]) => {
                    if (comment) {
                        const t = tasks[idx];
                        const title = (typeof t === 'object' && t !== null) ? t.title : t;
                        collected.push({
                            id: `tc-${date}-${idx}`,
                            date: date,
                            content: Array.isArray(comment) ? comment.join('\n') : comment,
                            taskTitle: title,
                            isTaskComment: true,
                            taskIndex: idx
                        });
                    }
                });
            }
        });
        return collected;
    }, [records, dailyTasks, student]);

    const combinedNotes = useMemo(() => {
        return [...notes, ...taskComments].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return String(b.id).localeCompare(String(a.id));
        });
    }, [notes, taskComments]);

    const recordDates = useMemo(() => Array.from(new Set(combinedNotes.map(n => n.date))), [combinedNotes]);
    
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteContent, setEditNoteContent] = useState("");
    const [editRelatedStudents, setEditRelatedStudents] = useState([]);
    const [editSearchText, setEditSearchText] = useState("");
    const [showEditStudentDropdown, setShowEditStudentDropdown] = useState(false);
    const [aiComment, setAiComment] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReportEdit, setShowReportEdit] = useState(false);
    const [reportStart, setReportStart] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
    const [reportEnd, setReportEnd] = useState(dayjs().format('YYYY-MM-DD'));
    const [tempComment, setTempComment] = useState("");
    const [reportFont, setReportFont] = useState('sans');
    const [showReportFontList, setShowReportFontList] = useState(false);
    const [reportFocus, setReportFocus] = useState('comprehensive');
    const [showCounselingAI, setShowCounselingAI] = useState(false);
    const [reportStats, setReportStats] = useState({ studentRate: 0, classRate: 0, tagStats: {}, studentScore: 0, classScore: 0, scoreDetails: { gained: 0, lost: 0 } });
    const [animatedWidths, setAnimatedWidths] = useState({ student: 0, class: 0 });
    const [showDetailStats, setShowDetailStats] = useState(false);
    const [showScoreAnalysis, setShowScoreAnalysis] = useState(false); // [New] 점수 분석 보기 토글
    const [showStickerHistory, setShowStickerHistory] = useState(false); // [New] 스티커 히스토리 보기 토글
    const [showTaskCommentHistory, setShowTaskCommentHistory] = useState(false); // [New] 과제 메모 히스토리 보기 토글
    const [showStudentRecordAI, setShowStudentRecordAI] = useState(false);
    const modalRef = useRef(null);
    const reportRef = useRef(null);
    const [phrases, setPhrases] = useState(() => { try { return JSON.parse(localStorage.getItem('cls_report_phrases') || '[]'); } catch { return []; } });
    const [showPhraseList, setShowPhraseList] = useState(false);
    const [chartType, setChartType] = useState('bar');
    const [grassStart, setGrassStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [grassEnd, setGrassEnd] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [stickerEffect, setStickerEffect] = useState(false);
    const [showButtonEffect, setShowButtonEffect] = useState(false);
    const [keepContent, setKeepContent] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGrassExpanded, setIsGrassExpanded] = useState(false); // [추가됨] 활동 잔디 접고 펴기 상태
    const [selectedGrassDate, setSelectedGrassDate] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [dateRangeAnim, setDateRangeAnim] = useState(false);
    const [cachedDetailDate, setCachedDetailDate] = useState(null); // [New] 애니메이션 중 데이터 유지용
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // [New] 슬라이드 상태 분리
    const [grassTheme, setGrassTheme] = useState(() => localStorage.getItem('cls_grass_theme') || 'indigo');
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [openCommentIndex, setOpenCommentIndex] = useState(null); // [New] 과제별 메모 입력창 상태
    const [commentInput, setCommentInput] = useState(""); // [New] 과제별 메모 입력값
    const [expandedComments, setExpandedComments] = useState({}); // [New] 점수 분석 내 메모 토글 상태
    
    // [New] 연동 상태 확인 및 기본값 설정 (초기화)
    const [hasNotionRecord, setHasNotionRecord] = useState(false);
    const [hasNotionPortfolio, setHasNotionPortfolio] = useState(false);
    const [hasGoogleSheet, setHasGoogleSheet] = useState(false);

    const [saveTargets, setSaveTargets] = useState(() => {
        // [Fix] 저장된 설정 우선 불러오기
        const savedPref = localStorage.getItem('cls_save_targets_pref');
        if (savedPref) {
            try { return new Set(JSON.parse(savedPref)); } catch(e) {}
        }

        const key = localStorage.getItem('cls_notion_key');
        const dbId = localStorage.getItem('cls_notion_db_id');
        const portDbId = localStorage.getItem('cls_notion_portfolio_db_id');
        const sheetUrl = localStorage.getItem('cls_google_sheet_url');
        const targets = new Set();
        if (isPortfolioMode && key && portDbId) targets.add('notion_portfolio');
        if (key && dbId) targets.add('notion_record');
        if (sheetUrl) targets.add('google_sheet');
        return targets;
    });
    
    const [notionDate, setNotionDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [notionContent, setNotionContent] = useState('');
    const [notionCategory, setNotionCategory] = useState('관찰');
    const [searchText, setSearchText] = useState("");
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [notionStatus, setNotionStatus] = useState('idle');
    const [hasNotionConfig, setHasNotionConfig] = useState(false);
    const [hasGoogleSheetConfig, setHasGoogleSheetConfig] = useState(false);
    const [saveProgress, setSaveProgress] = useState(0);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const key = localStorage.getItem('cls_notion_key');
            const dbId = localStorage.getItem('cls_notion_db_id');
            const portDbId = localStorage.getItem('cls_notion_portfolio_db_id');
            const sheetUrl = localStorage.getItem('cls_google_sheet_url');

            const rec = !!(key && dbId);
            const port = !!(key && portDbId);
            const sheet = !!sheetUrl;

            setHasNotionRecord(rec);
            setHasNotionPortfolio(port);
            setHasGoogleSheet(sheet);
            
            // 배지용 상태 업데이트 (호환성 유지)
            setHasNotionConfig(rec || port);
            setHasGoogleSheetConfig(sheet);

            // [New] 외부에서 점수 분석 보기를 요청했을 경우 자동 열림
            if (initialShowScoreAnalysis) setShowScoreAnalysis(true);
            else setShowScoreAnalysis(false);
            
            // [Fix] 저장된 설정이 있으면 불러오고, 없으면 기본값 설정
            const savedPref = localStorage.getItem('cls_save_targets_pref');
            if (savedPref) {
                try {
                    setSaveTargets(new Set(JSON.parse(savedPref)));
                } catch (e) {}
            } else {
                setSaveTargets(prev => {
                    const next = new Set();
                    if (isPortfolioMode && port) next.add('notion_portfolio');
                    else if (rec) next.add('notion_record');
                    if (sheet) next.add('google_sheet');
                    return next;
                });
            }
        }
    }, [isOpen, isPortfolioMode, initialShowScoreAnalysis]);

    // [New] 선택 상태 변경 시 저장
    useEffect(() => {
        localStorage.setItem('cls_save_targets_pref', JSON.stringify([...saveTargets]));
    }, [saveTargets]);

    // [New] 상세 뷰 데이터 캐싱 (닫힐 때 애니메이션 유지용)
    useEffect(() => {
        if (selectedGrassDate) {
            setCachedDetailDate(selectedGrassDate);
            setOpenCommentIndex(null);
            setCommentInput("");
        }
    }, [selectedGrassDate]);

    useEffect(() => {
        if (isOpen && isPortfolioMode && student) {
            setSearchText("");
            setSelectedStudents([student]);
        }
    }, [isOpen, isPortfolioMode, student]);

    useEffect(() => { 
        if (!student) return;
        setStickerCount(student.stickers || 0);
        if (!isLocalMode && db && appId) {
            const unsubscribe = db.collection('classes').doc(appId).collection('studentData').doc(String(student.id))
                .onSnapshot(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.counseling) setNotes(data.counseling);
                    }
                }, err => console.error("개별 데이터 로드 실패:", err));
            return () => unsubscribe();
        } else {
            const data = student.counseling;
            if (Array.isArray(data)) setNotes(data);
            else if (data) setNotes([{ id: Date.now(), date: dayjs().format('YYYY-MM-DD'), content: data }]);
            else setNotes([]);
        }
        setAiComment("");
        setSelectedStudents([student]);
        setNotionDate(dayjs().format('YYYY-MM-DD'));
        setNotionContent('');
        setNotionCategory('관찰');
        setNotionStatus('idle');
        setExpandedDates({});

        const key = localStorage.getItem('cls_notion_key');
        const dbId = localStorage.getItem('cls_notion_db_id');
        setHasNotionConfig(!!(key && dbId));
    }, [student, isLocalMode, db, appId]);

    useEffect(() => {
        setNotionDate(selectedDate || dayjs().format('YYYY-MM-DD'));
    }, [selectedDate]);

    const level = Math.floor(stickerCount / 5) + 1;
    
    const handleSticker = (delta, e) => { 
        const newCount = Math.max(0, stickerCount + delta);
        setStickerCount(newCount); 
        onSaveStickers(student.id, newCount); 
        if(delta > 0) {
            if (window.playAppSound) window.playAppSound(appConfig?.soundType || 'coin');
            setStickerEffect(true);
            setTimeout(() => setStickerEffect(false), 200);
            if (navigator.vibrate) navigator.vibrate(15);

            let origin = { y: 0.7 };
            if (e && e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;
                origin = {
                    x: x + (Math.random() - 0.5) * 0.05,
                    y: y + (Math.random() - 0.5) * 0.05
                };
            }

            if (newCount % 5 === 0) { 
                confetti({ particleCount: 100, spread: 70, origin, zIndex: 2000 });
                if(showToast) showToast(`🎉 레벨 업! Lv.${Math.floor(newCount / 5) + 1} 달성!`);
            }
            else { 
                confetti({ particleCount: 30, spread: 60, startVelocity: 30, origin, colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff'], shapes: ['circle', 'square'], zIndex: 2000 });
            }
        }
    };
    
    const handleDeleteNote = (id) => {
        const taskComment = taskComments.find(n => n.id === id);
        if (taskComment) {
            if (confirm("이 과제 메모를 삭제하시겠습니까?")) {
                onSaveTaskComment(student.id, taskComment.taskIndex, null, taskComment.date);
                showToast("과제 메모가 삭제되었습니다.");
            }
            return;
        }

        const noteToDelete = notes.find(n => n.id === id);
        if (!noteToDelete) return;

        const hasRelated = noteToDelete.relatedStudents && noteToDelete.relatedStudents.length > 0;

        const deleteSingle = () => {
            const newNotes = notes.filter(n => n.id !== id);
            setNotes(newNotes);
            onSaveCounseling(student.id, newNotes, "기록이 삭제되었습니다.");
        };

        const deleteAll = async () => {
            const targetIds = [student.id, ...noteToDelete.relatedStudents.map(s => s.id)];
            let updatedStudentsList = [...students];
            
            if (isLocalMode) {
                updatedStudentsList = updatedStudentsList.map(s => {
                    if (targetIds.includes(s.id)) {
                        const sNotes = s.id === student.id ? notes : (s.counseling || []);
                        const newSNotes = sNotes.filter(n => n.id !== id);
                        return { ...s, counseling: newSNotes };
                    }
                    return s;
                });
                setStudents(updatedStudentsList);
                saveData('cls_students', updatedStudentsList);
                setNotes(notes.filter(n => n.id !== id));
                showToast("관련된 모든 학생의 기록이 삭제되었습니다.");
            } else if (db && appId) {
                try {
                    const batch = db.batch();
                    const promises = targetIds.map(async (tId) => {
                        const ref = db.collection('classes').doc(appId).collection('studentData').doc(String(tId));
                        let tNotes = [];
                        if (tId === student.id) {
                            tNotes = notes;
                        } else {
                            const doc = await ref.get();
                            if (doc.exists) tNotes = doc.data().counseling || [];
                        }
                        const newTNotes = tNotes.filter(n => n.id !== id);
                        batch.set(ref, { counseling: newTNotes }, { merge: true });
                        
                        const sIndex = updatedStudentsList.findIndex(s => s.id === tId);
                        if (sIndex >= 0) {
                            updatedStudentsList[sIndex] = { ...updatedStudentsList[sIndex], counseling: newTNotes };
                        }
                    });
                    
                    await Promise.all(promises);
                    await batch.commit();
                    
                    setStudents(updatedStudentsList);
                    saveData('cls_students', updatedStudentsList);
                    setNotes(notes.filter(n => n.id !== id));
                    showToast("관련된 모든 학생의 기록이 삭제되었습니다.");
                } catch (e) {
                    console.error("Batch delete failed", e);
                    showToast("삭제 중 오류가 발생했습니다: " + e.message);
                }
            }
        };

        openConfirm("이 기록을 삭제하시겠습니까?", () => {
            if (hasRelated) {
                setTimeout(() => {
                    openConfirm(
                        `이 기록은 ${noteToDelete.relatedStudents.length}명의 다른 학생들과 함께 저장되었습니다.\n함께 기록된 학생들의 기록도 모두 삭제하시겠습니까?\n(취소 시 현재 학생의 기록만 삭제됩니다)`,
                        deleteAll,
                        deleteSingle
                    );
                }, 200);
            } else {
                deleteSingle();
            }
        });
    };
    
    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditNoteContent(note.content);
        setEditRelatedStudents(note.relatedStudents ? note.relatedStudents.filter(s => s.id !== student.id) : []);
    };

    const saveEditing = async () => {
        if (!editNoteContent.trim()) return;
        
        const taskComment = taskComments.find(n => n.id === editingNoteId);
        if (taskComment) {
            onSaveTaskComment(student.id, taskComment.taskIndex, editNoteContent.trim(), taskComment.date);
            setEditingNoteId(null);
            setEditNoteContent("");
            showToast("과제 메모가 수정되었습니다.");
            return;
        }

        const originalNote = notes.find(n => n.id === editingNoteId);
        if (!originalNote) return;

        const finalRelated = [{ id: student.id, name: student.name }, ...editRelatedStudents];
        const updatedNote = {
            ...originalNote,
            content: editNoteContent.trim(),
            relatedStudents: finalRelated.length > 1 ? finalRelated : null
        };

        // 1. 현재 화면의 notes 상태 즉시 업데이트 (UI 반응성)
        const newNotes = notes.map(n => n.id === editingNoteId ? updatedNote : n);
        setNotes(newNotes);

        // 2. 동기화 대상 학생 ID 목록 계산 (현재 설정된 관련 학생들 + 본인)
        const targetStudentIds = new Set(editRelatedStudents.map(s => s.id));
        targetStudentIds.add(student.id);

        // 3. 제외된 학생 ID 목록 계산 (원래 있었는데 빠진 학생들)
        const originalRelatedIds = originalNote.relatedStudents ? originalNote.relatedStudents.map(s => s.id) : [];
        const removedIds = originalRelatedIds.filter(id => !targetStudentIds.has(id));

        if (isLocalMode) {
            let updatedStudentsList = [...students];

            // 업데이트 대상 (추가/수정)
            targetStudentIds.forEach(tId => {
                const tStudent = updatedStudentsList.find(s => s.id === tId);
                if (tStudent) {
                    const tNotes = tStudent.counseling || [];
                    const noteIndex = tNotes.findIndex(n => n.id === editingNoteId);
                    let newTNotes;
                    if (noteIndex >= 0) {
                        newTNotes = [...tNotes];
                        newTNotes[noteIndex] = updatedNote;
                    } else {
                        newTNotes = [updatedNote, ...tNotes];
                    }
                    updatedStudentsList = updatedStudentsList.map(s => s.id === tId ? { ...s, counseling: newTNotes } : s);
                }
            });

            // 삭제 대상 (제외된 학생)
            removedIds.forEach(rId => {
                const rStudent = updatedStudentsList.find(s => s.id === rId);
                if (rStudent) {
                    const rNotes = rStudent.counseling || [];
                    const newRNotes = rNotes.filter(n => n.id !== editingNoteId);
                    updatedStudentsList = updatedStudentsList.map(s => s.id === rId ? { ...s, counseling: newRNotes } : s);
                }
            });

            setStudents(updatedStudentsList);
            saveData('cls_students', updatedStudentsList);
            showToast("기록이 수정 및 동기화되었습니다.");
        } else if (db && appId) {
            try {
                const promises = [];
                targetStudentIds.forEach(tId => {
                    promises.push(db.collection('classes').doc(appId).collection('studentData').doc(String(tId)).get().then(doc => {
                        let tNotes = [];
                        if (doc.exists) {
                            const data = doc.data();
                            tNotes = data.counseling || [];
                        }
                        const noteIndex = tNotes.findIndex(n => n.id === editingNoteId);
                        if (noteIndex >= 0) tNotes[noteIndex] = updatedNote;
                        else tNotes = [updatedNote, ...tNotes];
                        return { ref: doc.ref, counseling: tNotes };
                    }));
                });
                removedIds.forEach(rId => {
                    promises.push(db.collection('classes').doc(appId).collection('studentData').doc(String(rId)).get().then(doc => {
                        if (doc.exists) {
                            const data = doc.data();
                            let rNotes = data.counseling || [];
                            const newRNotes = rNotes.filter(n => n.id !== editingNoteId);
                            return { ref: doc.ref, counseling: newRNotes };
                        }
                        return null;
                    }));
                });
                const results = await Promise.all(promises);
                const batch = db.batch();
                let updateCount = 0;
                results.forEach(res => {
                    if (res) {
                        batch.set(res.ref, { counseling: res.counseling }, { merge: true });
                        updateCount++;
                    }
                });
                if (updateCount > 0) {
                    await batch.commit();
                    showToast("기록이 수정 및 동기화되었습니다.");
                }
            } catch (e) {
                console.error("동기화 저장 실패:", e);
                showToast("저장 중 오류가 발생했습니다: " + e.message);
            }
        }

        setEditingNoteId(null);
        setEditNoteContent("");
        setEditRelatedStudents([]);
    };

    const handleAddEditStudent = (s) => {
        if (!editRelatedStudents.some(rs => rs.id === s.id) && s.id !== student.id) {
            setEditRelatedStudents([...editRelatedStudents, { id: s.id, name: s.name }]);
        }
        setEditSearchText("");
        setShowEditStudentDropdown(false);
    };

    const handleRemoveEditStudent = (id) => {
        setEditRelatedStudents(editRelatedStudents.filter(s => s.id !== id));
    };

    const handleStudentSelect = (name) => {
        const s = students.find(st => st.name === name);
        if (s && !selectedStudents.find(sel => sel.id === s.id)) {
            setSelectedStudents(prev => [...prev, s]);
        }
    };
    
    const removeSelectedStudent = (id) => {
        setSelectedStudents(prev => prev.filter(s => s.id !== id));
    };

    const handleIntegratedSave = async (targetCategory, e) => {
        const category = targetCategory || '관찰';
        const content = notionContent.trim();
        const date = notionDate || dayjs().format('YYYY-MM-DD');

        if (!content) return showToast("내용을 입력해주세요.");
        setNotionStatus('saving');
        setSaveProgress(0);

        let totalOps = 0;
        if (saveTargets.has('google_sheet')) totalOps += 1;
        if (saveTargets.has('notion_portfolio')) totalOps += 1;
        if (saveTargets.has('notion_record')) totalOps += selectedStudents.length;
        if (totalOps === 0) totalOps = 1;
        let completedOps = 0;
        const updateProgress = () => { completedOps++; setSaveProgress(Math.min(Math.round((completedOps / totalOps) * 100), 99)); };
        
        let tags = [];
        if (saveTargets.has('notion_record')) tags.push("노션(기록)");
        if (saveTargets.has('notion_portfolio')) tags.push("노션(포폴)");
        if (saveTargets.has('google_sheet')) tags.push("구글 시트");

        // [New] 함께 기록된 학생 정보 저장
        const relatedStudents = selectedStudents.length > 1 
            ? selectedStudents.map(s => ({ id: s.id, name: s.name })) 
            : null;

        const newNote = { id: Date.now(), date: date, content: content, destTags: tags, relatedStudents: relatedStudents };
        const targetIds = selectedStudents.map(s => s.id);
        
        let updatedStudentsList = [...students];

        for (const targetId of targetIds) {
            const studentObj = students.find(s => s.id === targetId);
            if (!studentObj) continue;

            let prevNotes = [];
            // 🌟 클라우드 모드: 보이지 않는 하위 금고(studentData)에서 옛날 기록을 먼저 꺼내옵니다.
            if (!isLocalMode && db && appId) {
                try {
                    const doc = await db.collection('classes').doc(appId).collection('studentData').doc(String(targetId)).get();
                    if (doc.exists && doc.data().counseling) {
                        prevNotes = doc.data().counseling;
                    }
                } catch (e) { console.error("과거 기록 불러오기 실패:", e); }
            } else {
                prevNotes = studentObj.counseling || [];
            }

            const updatedNotes = [newNote, ...prevNotes];
            let updatedStickers = studentObj.stickers || 0;
            if (category === '칭찬') updatedStickers += 1;

            // 🌟 클라우드 모드: 옛날 기록과 새 기록을 합쳐서 다시 금고에 안전하게 넣습니다!
            if (!isLocalMode && db && appId) {
                await db.collection('classes').doc(appId).collection('studentData').doc(String(targetId)).set({ counseling: updatedNotes }, { merge: true });
                updatedStudentsList = updatedStudentsList.map(s => s.id === targetId ? { ...s, stickers: updatedStickers } : s);
            } else {
                updatedStudentsList = updatedStudentsList.map(s => s.id === targetId ? { ...s, counseling: updatedNotes, stickers: updatedStickers } : s);
            }
        }

        setStudents(updatedStudentsList);
        if (!isLocalMode) saveData('cls_students', updatedStudentsList);
        else localStorage.setItem('cls_students', JSON.stringify(updatedStudentsList));

        if (targetIds.includes(student.id)) {
            setNotes(prev => [newNote, ...prev]);
            if (category === '칭찬') {
                setStickerCount(prev => prev + 1);
                setShowButtonEffect(true); setTimeout(() => setShowButtonEffect(false), 800);
                setStickerEffect(true); setTimeout(() => setStickerEffect(false), 200);
                if (navigator.vibrate) navigator.vibrate(15);

                let origin = { y: 0.7 };
                if (e && e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                    origin = { x: x + (Math.random() - 0.5) * 0.05, y: y + (Math.random() - 0.5) * 0.05 };
                }
                if ((stickerCount + 1) % 5 === 0) { 
                    confetti({ particleCount: 100, spread: 70, origin, zIndex: 2000 });
                    if(showToast) showToast(`🎉 레벨 업! Lv.${Math.floor((stickerCount + 1) / 5) + 1} 달성!`);
                } else { 
                    confetti({ particleCount: 30, spread: 60, startVelocity: 30, origin, colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff'], shapes: ['circle', 'square'], zIndex: 2000 });
                }
            }
        }

        if (saveTargets.has('google_sheet')) {
            let successCount = 0;
            // 🌟 줄 세우지 않고, 배열 통째로 전송!
            if (await saveToGoogleSheet(selectedStudents, category, content, date)) {
                successCount = selectedStudents.length;
            }
            updateProgress();
            if (successCount > 0) {
                setNotionStatus('success'); 
                if (!keepContent) setNotionContent(''); 
                setTimeout(() => setNotionStatus('idle'), 3000); 
                showToast("✅ 기록이 저장되었습니다!");
                if (closeAfterSave) onClose();
            }
        }

        try {
            const rawKey = localStorage.getItem('cls_notion_key') || "";
            const personalKey = rawKey.replace(/["']/g, '').trim();
            const targets = [];
            if (saveTargets.has('notion_record')) targets.push('notion_record');
            if (saveTargets.has('notion_portfolio')) targets.push('notion_portfolio');

            for (const target of targets) {
                const rawDbId = (target === 'notion_portfolio') ? (localStorage.getItem('cls_notion_portfolio_db_id') || "") : (localStorage.getItem('cls_notion_db_id') || "");
                const targetDbId = rawDbId.replace(/["']/g, '').trim();
                if (!personalKey || !targetDbId) continue;

                const bodyData = { category: category, content: content, personalKey: personalKey, personalDbId: targetDbId };
                
                if (target === 'notion_portfolio') {
                    const map = JSON.parse(localStorage.getItem('cls_student_map') || '{}');
                    const ids = []; selectedStudents.forEach(s => { if (map[s.name]) ids.push(map[s.name]); });
                    
                    // 🌟 선택된 아이들의 이름을 쉼표로 모두 연결합니다. (예: "김철수, 이영희, 박지민")
                    const joinedNames = selectedStudents.map(s => s.name).join(', ');
                    
                    bodyData.mode = 'relation'; 
                    bodyData.studentIds = ids;
                    bodyData.studentName = joinedNames; // 노션의 '제목' 또는 '이름' 칸에 한 번에 전송!
                    
                    await fetch('/api/save-notion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });
                    updateProgress();
                } else {
                    // [Fix] 노션(기록) 모드일 때 선택된 모든 학생에 대해 개별 저장
                    for (const s of selectedStudents) {
                        const individualBody = { 
                            ...bodyData, 
                            mode: 'normal', 
                            studentName: s.name, 
                            date: dayjs(date).format('YYYY-MM-DD') 
                        };
                        await fetch('/api/save-notion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(individualBody) });
                        
                        // 🌟 핵심 해결책: 노션 서버가 튕겨내지 못하게 1명 저장할 때마다 0.35초(350ms)씩 부드럽게 숨을 고릅니다!
                        await new Promise(resolve => setTimeout(resolve, 350)); 
                        updateProgress();
                    }
                }
            }
            setSaveProgress(100);
            setNotionStatus('success'); if(typeof showToast !== 'undefined') showToast("✨ 외부 서비스 연동이 안전하게 완료되었습니다!"); if (!keepContent) setNotionContent(''); setTimeout(() => setNotionStatus('idle'), 3000);
            showToast("✅ 기록이 저장되었습니다!");
        } catch (e) {
            console.error(e); setNotionStatus('error'); setTimeout(() => setNotionStatus('idle'), 3000);
        }
    };
    
    const calculateStatsForPeriod = (startStr, endStr) => {
        let pTotal = 0, pDone = 0;
        let pScore = 0;
        let gained = 0; // [New] 얻은 점수
        let lost = 0;   // [New] 잃은 점수 (페널티)
        const pMissed = {};
        const tagStats = {};
        const taskDetails = []; // [New] 상세 리스트 저장용
        let curr = dayjs(startStr);
        const end = dayjs(endStr);
        const today = dayjs().startOf('day');
        let classTotal = 0, classDone = 0;
        let classScoreSum = 0;

        while(curr.isBefore(end) || curr.isSame(end, 'day')) {
            const dStr = curr.format('YYYY-MM-DD');
            if (curr.day() === 0 || curr.day() === 6) { curr = curr.add(1, 'day'); continue; }
            const tasks = dailyTasks[dStr] || [];
            const rec = records[dStr]?.[student.id];
            
            const diffDays = today.diff(curr, 'day');
            const isFuture = diffDays < 0;

            if (tasks.length > 0) {
                pTotal += tasks.length;
                tasks.forEach(t => {
                    const tag = typeof t === 'object' ? t.tag : '기타';
                    if (!tagStats[tag]) tagStats[tag] = { sTotal: 0, sDone: 0, cTotal: 0, cDone: 0 };
                });
                tasks.forEach((t, idx) => {
                    const title = typeof t === 'object' ? t.title : t;
                    const tag = typeof t === 'object' ? t.tag : '기타';
                    const isDone = rec?.tasks ? rec.tasks[idx] : (rec?.done && !rec.tasks);
                    const isLate = rec?.lateTasks ? !!rec.lateTasks[idx] : false;
                    const comment = rec?.taskComments ? rec.taskComments[idx] : null;
                    const lateDateStr = isLate ? (typeof rec.lateTasks[idx] === 'string' ? rec.lateTasks[idx] : null) : null;
                    
                    tagStats[tag].sTotal++;
                    
                    let status = 'missed';
                    let currentPenalty = 0;
                    let currentGained = 0;

                    if(isDone) {
                        pDone++;
                        tagStats[tag].sDone++;
                        pScore += 0.5;
                        gained += 0.5;
                        currentGained = 0.5;
                        
                        if (isLate) {
                            status = 'late';
                        } else {
                            status = 'on-time';
                        }
                    } else {
                        status = 'missed';
                        pMissed[tag] = (pMissed[tag] || 0) + 1;
                        if (!isFuture) {
                            const penalty = Math.min(3, diffDays + 1);
                            pScore -= penalty;
                            lost += penalty;
                            currentPenalty = penalty;
                        }
                    }
                    
                    if (!isFuture) {
                        taskDetails.push({ date: dStr, idx, title, tag, status, penalty: currentPenalty, gained: currentGained, comment });
                    }
                });
                const recs = records[dStr] || {};
                students.forEach(s => {
                    const r = recs[s.id];
                    classTotal += tasks.length;
                    tasks.forEach((t, idx) => {
                        const tag = typeof t === 'object' ? t.tag : '기타';
                        tagStats[tag].cTotal++;
                        let taskDone = false;
                        if (r && (r.tasks ? r.tasks[idx] : r.done)) taskDone = true;
                        
                        const isTaskLate = r?.lateTasks ? !!r.lateTasks[idx] : false;
                        const taskLateDateStr = isTaskLate ? (typeof r.lateTasks[idx] === 'string' ? r.lateTasks[idx] : null) : null;

                        if (taskDone) { 
                            tagStats[tag].cDone++; 
                            classDone++; 
                            classScoreSum += 0.5;
                        } else {
                            if (!isFuture) {
                                const penalty = Math.min(3, diffDays + 1);
                                classScoreSum -= penalty;
                            }
                        }
                    });
                });
            }
            curr = curr.add(1, 'day');
        }
        
        taskDetails.sort((a, b) => b.date.localeCompare(a.date));

        const pRate = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
        const classAvgRate = classTotal > 0 ? Math.round((classDone / classTotal) * 100) : 0;
        const classAvgScore = students.length > 0 ? (classScoreSum / students.length) : 0;

        return { pRate, classAvgRate, pTotal, pDone, pMissed, tagStats, pScore, classAvgScore, scoreDetails: { gained, lost }, taskDetails };
    };

    const handleTaskStatusChange = async (date, idx, newStatus) => {
        let newRecords = { ...records };
        if (!newRecords[date]) newRecords[date] = {};
        if (!newRecords[date][student.id]) newRecords[date][student.id] = {};
        
        let studentRec = { ...newRecords[date][student.id] };
        if (!studentRec.tasks) studentRec.tasks = {};
        if (!studentRec.lateTasks) studentRec.lateTasks = {};

        if (newStatus === 'on-time') {
            studentRec.tasks[idx] = true;
            delete studentRec.lateTasks[idx];
        } else if (newStatus === 'late') {
            studentRec.tasks[idx] = true;
            studentRec.lateTasks[idx] = dayjs().format('YYYY-MM-DD'); 
        } else if (newStatus === 'missed') {
            studentRec.tasks[idx] = false;
            delete studentRec.lateTasks[idx];
        }

        newRecords[date][student.id] = studentRec;
        setRecords(newRecords);
        
        if (!isLocalMode && db && appId) {
            try {
                await db.collection('classes').doc(appId).collection('records').doc(date).set({
                    [student.id]: studentRec
                }, { merge: true });
            } catch (e) {
                console.error(e);
            }
        } else {
            saveData('cls_records', newRecords);
        }
        
        if (showToast) showToast(`제출 상태가 변경되었습니다.`);
    };
    
    useEffect(() => {
        if (isOpen && student && students) {
            const stats = calculateStatsForPeriod(reportStart, reportEnd);
            setReportStats({ studentRate: stats.pRate, classRate: stats.classAvgRate, tagStats: stats.tagStats, studentScore: stats.pScore, classScore: stats.classAvgScore, scoreDetails: stats.scoreDetails });
            
            // Animation logic
            const timer = setTimeout(() => {
                setAnimatedWidths({ student: stats.pRate, class: stats.classAvgRate });
            }, 100);
            
            return () => clearTimeout(timer);
        } else {
            // Reset widths when modal closes for next open animation
            setAnimatedWidths({ student: 0, class: 0 });
        }
    }, [isOpen, student, students, records, dailyTasks, reportStart, reportEnd]);
    
    const generateReportContent = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const stats = calculateStatsForPeriod(reportStart, reportEnd);
            const { pRate, classAvgRate, pTotal, pDone, pMissed, tagStats, pScore, classAvgScore, scoreDetails } = stats;
            setReportStats({ studentRate: pRate, classRate: classAvgRate, tagStats, studentScore: pScore, classScore: classAvgScore, scoreDetails });
            const pNotes = notes.filter(n => n.date >= reportStart && n.date <= reportEnd);
            
            // [New] 지각 제출 계산
            let lateCount = 0;
            const taskCommentsList = [];
            let curr = dayjs(reportStart);
            const end = dayjs(reportEnd);
            while(curr.isBefore(end) || curr.isSame(end, 'day')) {
                const dStr = curr.format('YYYY-MM-DD');
                const rec = records[dStr]?.[student.id];
                if (rec) {
                    if (rec.lateTasks) lateCount += Object.keys(rec.lateTasks).length;
                    if (rec.taskComments) {
                        const tasks = dailyTasks[dStr] || [];
                        Object.entries(rec.taskComments).forEach(([idx, comment]) => {
                            if (comment) {
                                const t = tasks[idx];
                                const title = (typeof t === 'object' && t !== null) ? t.title : t;
                                if (title) {
                                    taskCommentsList.push(`[${dStr}] 과제(${title}): ${comment}`);
                                }
                            }
                        });
                    }
                }
                curr = curr.add(1, 'day');
            }

            const missedList = Object.entries(pMissed).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>`${x[0]}(${x[1]}회)`);
            const weakSubjects = [];
            if (tagStats) {
                Object.entries(tagStats).forEach(([tag, stat]) => {
                    const sRate = stat.sTotal > 0 ? Math.round((stat.sDone / stat.sTotal) * 100) : 0;
                    const cRate = stat.cTotal > 0 ? Math.round((stat.cDone / stat.cTotal) * 100) : 0;
                    if (cRate - sRate >= 15) weakSubjects.push(tag);
                });
            }
            const weakSubjectsStr = weakSubjects.length > 0 ? weakSubjects.join(', ') : '없음';
            if (apiKey) {
                if(showToast) showToast("AI가 리포트를 작성 중입니다...");
                
                // [보안] 데이터 익명화 처리
                const safeName = "[STUDENT_TOKEN]";
                
                // [New] 성장 추이 분석
                const startObj = dayjs(reportStart);
                const endObj = dayjs(reportEnd);
                const duration = endObj.diff(startObj, 'day');
                const prevStart = startObj.subtract(duration + 1, 'day').format('YYYY-MM-DD');
                const prevEnd = startObj.subtract(1, 'day').format('YYYY-MM-DD');
                const prevStats = calculateStatsForPeriod(prevStart, prevEnd);
                let growthText = "";
                if (prevStats.pTotal > 0) {
                    const diff = pRate - prevStats.pRate;
                    growthText = `(지난 기간 ${prevStats.pRate}% 대비 ${diff >= 0 ? '+' : ''}${diff}%p ${diff >= 0 ? '상승📈' : '하락📉'})`;
                }

                // [New] 중점 분석 분야 프롬프트
                let focusGuide = "";
                if (reportFocus === 'study') focusGuide = "특히 '학습 태도'와 '학업 성취'를 중점적으로 분석하고, 학습 습관 개선을 위한 구체적인 조언을 포함해.";
                else if (reportFocus === 'relationship') focusGuide = "특히 '교우 관계'와 '사회성'을 중점적으로 분석하고, 또래와의 상호작용에 대한 조언을 포함해.";
                else if (reportFocus === 'habit') focusGuide = "특히 '기본 생활 습관'과 '규칙 준수' 여부를 중점적으로 분석해.";
                else focusGuide = "학교 생활 전반(학습, 생활, 관계)을 균형 있게 종합적으로 분석해.";

                // [보안 강화] 대상 학생 외에 다른 학생들의 이름도 모두 익명화
                let safeNotesStr = pNotes.map(n => `[${n.date}] ${n.content}`).join('\n');
                if (taskCommentsList.length > 0) {
                    safeNotesStr += `\n\n[과제별 메모]\n${taskCommentsList.join('\n')}`;
                }
                safeNotesStr = anonymizeText(safeNotesStr, student.name);
                students.forEach(s => {
                    if (s.id !== student.id) {
                        safeNotesStr = safeNotesStr.replaceAll(s.name, "급우");
                        if (s.name.length >= 3) safeNotesStr = safeNotesStr.replaceAll(s.name.substring(1), "급우");
                    }
                });
                
                const securityRule = "[보안 규칙:당신은 철저한 익명성을 유지해야 합니다. 응답 내용에 사람의 이름이나 실명을 유추할 수 있는 단어를 절대 포함하지 마세요. 대명사가 필요할 때는 반드시 '해당 학생'이라고만 지칭하세요.]";

                const prompt = `${securityRule}
너는 10년 차 이상의 따뜻하고 전문적인 통찰력 있는 초등학교 교사야. 학부모님에게 학생의 객관적 데이터에 기반한 성장 리포트를 작성해 줘.

[엄격한 작성 규칙]
1. 환각(지어내기) 금지: 제공된 [학생 데이터]에 명시되지 않은 사실은 단 한 문장도 창작하지 마. 기록이 부족하면 억지로 지어내지 말고 있는 사실만 적어.
2. 어조: AI 같은 기계적인 말투는 피하고, 전문가답지만 따뜻한 교사의 말투로 개조식(글머리 기호) 작성을 해.
3. 객관성: 특징이나 단점을 서술할 때는 반드시 데이터에 기록된 날짜를 함께 묶어 출처를 명확히 해.
4. 분석 초점: ${focusGuide}

[학생 데이터]
- 이름: ${safeName}
- 과제 수행률: ${pRate}% ${growthText}
- 선생님의 관찰 및 칭찬 기록: ${pNotes.length > 0 ? safeNotesStr : '특이 기록 없음'}

[출력 양식]
### 📊 이번 달 핵심 요약
- (과제 수행률 숫자를 명시하며 노력한 과정을 구체적으로 칭찬. 성장 추이가 있다면 언급)
- (관찰 기록을 바탕으로 학생의 가장 돋보인 핵심 역량 해시태그 3개 추출. 예: #따뜻한배려심 #책임감 #스스로하기)

### ✨ 긍정적 관찰 사실
- (선생님이 남긴 관찰/칭찬 기록의 사실만 그대로 인용하며 구체적으로 칭찬 2~3줄)
- 반드시 각 문장 끝에 [출처: O월 O일 기록] 형식으로 출처 표기

### 🌱 도약을 위한 성장 포인트
- (단점이나 아쉬운 점을 객관적인 사실로 먼저 명시한 뒤, 이를 '앞으로 기대되는 긍정적인 신호나 발전 가능성'으로 전환하여 부드럽게 1~2줄 서술)
- 반드시 각 문장 끝에 [출처: O월 O일 기록] 형식으로 출처 표기 (※ 기록에 단점이 없다면 이 항목은 생략하거나 추가 칭찬으로 대체)

### 🚀 다음 달 실천 목표
- (위의 성장 포인트를 해결하기 위해 학생이 스스로 매일 실천할 수 있는 아주 작고 구체적인 행동 미션 2가지 제시)

### 💬 참고 자료: 가정 내 연계 대화문
- (학부모님이 집에서 아이의 눈을 보며 자연스럽게 건넬 수 있는 칭찬과 격려의 따옴표 대화 스크립트 1~2줄 제공)`;
                
                const aiText = await callGemini(apiKey, prompt, 0.7);
                
                // [보안] 결과 복호화
                const finalContent = deanonymizeText(aiText, student.name);
                setTempComment(finalContent);
            } else {
                const tpl = `${student.name} 학생은 ${reportStart}부터 ${reportEnd}까지 성실하게 학교 생활을 했습니다.\n\n이 기간 동안 과제 수행률은 ${pRate}%이며, ${missedList.length > 0 ? `주로 ${missedList.join(', ')} 과목에서 보완이 필요해 보입니다.` : '모든 과목을 훌륭하게 수행했습니다.'}\n\n가정에서도 많은 격려 부탁드립니다.`;
                setTempComment(tpl);
            }
        } catch (e) {
            if(showToast) showToast("❌ 리포트 생성에 실패했습니다: " + e.message);
        } finally { setIsGenerating(false); }
    };
    
    const handlePrepareReport = () => {
        const stats = calculateStatsForPeriod(reportStart, reportEnd);
        setReportStats({ studentRate: stats.pRate, classRate: stats.classAvgRate, tagStats: stats.tagStats, studentScore: stats.pScore, classScore: stats.classAvgScore, scoreDetails: stats.scoreDetails });
        const savedDraft = student.recordDrafts?.['growth_report'];
        if (savedDraft) {
            setTempComment(savedDraft);
        } else {
            setTempComment(`${student.name} 학생은 현재 레벨 ${level}로 성실하게 학교 생활을 하고 있습니다.`);
        }
        setShowReportEdit(true);
    };
    
    const handleSaveReportDraft = () => onSaveRecordDraft(student.id, 'growth_report', tempComment);

    const handleDownloadReport = async () => {
        setShowReportEdit(false); setAiComment(tempComment); setIsGenerating(true);
        if(showToast) showToast("⏳ 리포트를 고화질 이미지로 변환 중입니다...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const canvas = await window.html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `${student.name}_성장리포트_${dayjs().format('YYYYMMDD')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            if(showToast) showToast("❌ 이미지 저장에 실패했습니다: " + e.message);
        } finally { setIsGenerating(false); }
    };
    
    const handleCopyText = () => { navigator.clipboard.writeText(tempComment).then(() => { if(showToast) showToast("📋 내용이 클립보드에 안전하게 복사되었습니다."); }); };

    const handlePhotoUploadWithState = async (e, id) => {
        setIsUploadingPhoto(true);
        try {
            await onPhotoUpload(e, id);
            if (showToast) showToast("사진이 업데이트되었습니다.");
        } catch (err) {
            console.error("사진 업로드 에러:", err);
            if (showToast) showToast("사진 업로드 중 문제가 발생했습니다.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const grassHistory = useMemo(() => {
        const start = dayjs(grassStart);
        const end = dayjs(grassEnd);
        const diff = end.diff(start, 'day') + 1;
        const history = [];
        
        const startDay = start.day();
        if (startDay >= 2 && startDay <= 5) {
            for (let k = 1; k < startDay; k++) {
                history.push({ isPadding: true, date: `pad-${k}` });
            }
        }

        for (let i = 0; i < diff; i++) {
            const d = start.add(i, 'day');
            const dStr = d.format('YYYY-MM-DD');
            const dayOfWeek = d.day();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            const tasks = dailyTasks[dStr] || [];
            const rec = records[dStr]?.[student.id];
            let done = 0; let total = 0;
            if (tasks.length > 0) {
                total = tasks.length;
                if (rec) {
                    tasks.forEach((_, idx) => {
                        if (rec.tasks && rec.tasks[idx]) done++;
                        else if (!rec.tasks && rec.done) done++;
                    });
                }
            } else { if (rec && rec.done) { total = 1; done = 1; } }
            const ratio = total > 0 ? done / total : 0;
            history.push({ date: dStr, ratio, count: done, total });
        }
        return history;
    }, [grassStart, grassEnd, dailyTasks, records, student.id]);

    const avgRate = useMemo(() => {
        const history = student.history || [];
        return history.length > 0 ? Math.round((history.reduce((acc, h) => acc + h.ratio, 0) / history.length) * 100) : 0;
    }, [student.history]);
    
    const missedTags = useMemo(() => {
        const counts = {};
        dates.forEach(date => {
            const day = dayjs(date).day();
            if (day === 0 || day === 6) return;

            const tasks = dailyTasks[date];
            const rec = records[date]?.[student.id];
            if (tasks && tasks.length > 0) {
                tasks.forEach((task, idx) => {
                    let isDone = false;
                    if (rec) { if (rec.tasks) isDone = !!rec.tasks[idx]; else isDone = !!rec.done; }
                    if (!isDone) {
                        const tag = typeof task === 'object' ? task.tag : '기타';
                        counts[tag] = (counts[tag] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    }, [student, records, dailyTasks, dates]);
    
    const reportHistoryData = useMemo(() => {
        const history = [];
        let curr = dayjs(reportStart);
        const end = dayjs(reportEnd);
        while(curr.isBefore(end) || curr.isSame(end, 'day')) {
            const dStr = curr.format('YYYY-MM-DD');
            if (curr.day() === 0 || curr.day() === 6) { curr = curr.add(1, 'day'); continue; }
            history.push({ date: dStr, ratio: 0.8, count: 4, total: 5 });
            curr = curr.add(1, 'day');
        }
        return history;
    }, [reportStart, reportEnd]);

    const handleSaveAIAdvice = (adviceText) => {
        const newNote = { id: Date.now(), date: dayjs().format('YYYY-MM-DD'), content: `[AI 상담]\n${adviceText}` };
        const newNotes = [newNote, ...notes];
        setNotes(newNotes);
        onSaveCounseling(student.id, newNotes, "AI 상담 내용이 기록되었습니다.");
    };
    
    const handleOpenCounselingAI = () => {
        if (!apiKey) return showToast("설정에서 API 키를 먼저 입력해주세요.");
        setShowCounselingAI(true);
    };
    
    const handleOpenStudentRecordAI = () => {
        if (!apiKey) return showToast("설정에서 API 키를 먼저 입력해주세요.");
        setShowStudentRecordAI(true);
    };
    
    const getPieStyle = (ratio) => {
        if (ratio <= 0) return { backgroundColor: '#f1f5f9' };
        if (ratio >= 1) return { backgroundColor: '#22c55e' };
        const percentage = ratio * 100;
        return { background: `conic-gradient(#4ade80 0% ${percentage}%, #f1f5f9 ${percentage}% 100%)` };
    };
    
    const getLevelColor = (lv) => {
        if (lv >= 5) return 'bg-orange-400';
        if (lv === 4) return 'bg-purple-400';
        if (lv === 3) return 'bg-indigo-400';
        if (lv === 2) return 'bg-blue-400';
        return 'bg-green-400';
    };
    
    const getLevelTextColor = (lv) => {
        if (lv >= 5) return 'text-orange-500';
        if (lv === 4) return 'text-purple-500';
        if (lv === 3) return 'text-indigo-600';
        if (lv === 2) return 'text-blue-500';
        return 'text-green-500';
    };

    const handleAddPhrase = () => {
        if (!tempComment.trim()) return showToast("저장할 내용이 없습니다.");
        const newPhrases = [...phrases, tempComment.trim()];
        setPhrases(newPhrases);
        localStorage.setItem('cls_report_phrases', JSON.stringify(newPhrases));
        showToast("상용구로 저장되었습니다.");
    };
    
    const handleDeletePhrase = (idx) => {
        const newPhrases = phrases.filter((_, i) => i !== idx);
        setPhrases(newPhrases);
        localStorage.setItem('cls_report_phrases', JSON.stringify(newPhrases));
    };
    
    const handleApplyPhrase = (text) => {
        setTempComment(prev => prev + (prev ? "\n\n" : "") + text);
        setShowPhraseList(false);
        showToast("✨ 상용구 내용이 추가되었습니다.");
    };

   const filteredNotes = combinedNotes.filter(n => {
        const matchDate = selectedDate ? n.date === selectedDate : true;
        const matchText = searchTerm 
            ? (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase())) || 
              (n.date && n.date.includes(searchTerm)) ||
              (n.taskTitle && n.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
        return matchDate && matchText;
    });
    
    const displayedNotes = isExpanded ? filteredNotes : filteredNotes.slice(0, 2);
    const hasMore = filteredNotes.length > 2;

    const todayStr = dayjs().format('YYYY-MM-DD');
    const currentWeekGrass = grassHistory.filter(h => dayjs(h.date).isSame(dayjs(), 'week'));
    const defaultGrass = currentWeekGrass.length > 0 ? currentWeekGrass : grassHistory.slice(-5);
    const displayedGrass = isGrassExpanded ? grassHistory : defaultGrass;

    const currentIndex = students ? students.findIndex(s => s.id === student.id) : -1;
    const hasPrev = currentIndex > 0;
    const hasNext = students && currentIndex >= 0 && currentIndex < students.length - 1;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[1600] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300 animate-fade-in" onClick={(e) => {
             if (showStickerHistory) setShowStickerHistory(false);
             else if (showTaskCommentHistory) setShowTaskCommentHistory(false);
             else onClose();
        }}>
            {hasPrev && (
                <button onClick={(e) => { e.stopPropagation(); onSwitchStudent(students[currentIndex - 1].id); }} className="hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white text-slate-700 rounded-full backdrop-blur-md shadow-lg transition-all z-[1610] group border border-white/20 hover:scale-110">
                    <Icon d={PATHS.left} size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            )}
            {hasNext && (
                <button onClick={(e) => { e.stopPropagation(); onSwitchStudent(students[currentIndex + 1].id); }} className="hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white text-slate-700 rounded-full backdrop-blur-md shadow-lg transition-all z-[1610] group border border-white/20 hover:scale-110">
                    <Icon d={PATHS.right} size={28} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}
            <div ref={modalRef} className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-modal-enter relative" onClick={e => {
                e.stopPropagation();
                if (showStickerHistory) setShowStickerHistory(false);
                if (showTaskCommentHistory) setShowTaskCommentHistory(false);
            }}>
                <style>{`
                    @keyframes wiggle-big {
                        0%, 100% { transform: rotate(-8deg) scale(1.15); }
                        50% { transform: rotate(8deg) scale(1.15); }
                    }
                    .animate-wiggle-big {
                        animation: wiggle-big 1.2s ease-in-out infinite;
                        display: inline-block;
                    }
                `}</style>
                <div className="bg-white px-6 py-5 border-b border-slate-100 flex-shrink-0 z-10 flex items-center justify-between">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-50/50 border-2 border-white ring-1 ring-slate-100 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0 relative group cursor-pointer transition-all hover:shadow-lg" onClick={(e) => e.stopPropagation()}>
                                {student.photoUrl ? (
                                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-indigo-300">
                                        <span className="text-3xl group-hover:scale-110 transition-transform">{student.gender === 'M' ? '👦' : '👧'}</span>
                                    </div>
                                )}
                                <label className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 transition-all duration-300 cursor-pointer backdrop-blur-[1px] ${isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {isUploadingPhoto ? (
                                        <Icon d={PATHS.spinner} size={20} className="text-white animate-spin" />
                                    ) : (
                                        <>
                                            <Icon d={PATHS.upload} size={16} className="text-white mb-0.5 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                                            <span className="text-white text-[10px] font-bold tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">사진 변경</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUploadWithState(e, student.id)} disabled={isUploadingPhoto} />
                                </label>
                            </div>
                            <div>
                                <div className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                    {student.name}
                                    <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{student.order}번</span>
                                    {taskComments.length > 0 && (
                                        <span 
                                            className="animate-wiggle-big drop-shadow-sm cursor-pointer ml-1" 
                                            title="작성된 과제 메모가 있습니다" 
                                            onClick={(e) => { e.stopPropagation(); setShowTaskCommentHistory(true); }}
                                        >
                                            📮
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-bold text-indigo-500 mt-1 flex items-center gap-2 flex-wrap">
                                    <span>Level {level}</span>
                                    <span className="text-slate-400 font-normal">| 평균 수행률 {avgRate}%</span>
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setShowTaskCommentHistory(!showTaskCommentHistory)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 transition-colors ${taskComments.length > 0 ? 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            <Icon d={PATHS.message} size={10} />
                                            과제 메모 {taskComments.length}
                                        </button>
                                        {showTaskCommentHistory && (
                                            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in cursor-default">
                                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                                    <h5 className="text-xs font-bold text-slate-600 flex items-center gap-1">📝 과제 메모 기록 <span className="text-slate-400 font-normal">({taskComments.length})</span></h5>
                                                    <button onClick={() => setShowTaskCommentHistory(false)} className="text-slate-400 hover:text-slate-600"><Icon d={PATHS.x} size={12}/></button>
                                                </div>
                                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll">
                                                    {taskComments.length > 0 ? (
                                                        taskComments.sort((a,b) => b.date.localeCompare(a.date)).map((note, index) => (
                                                            <div key={note.id} className="text-xs group animate-fade-in" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 rounded">{dayjs(note.date).format('MM/DD')}</span>
                                                                    <span className="px-1.5 py-0.5 border border-indigo-200 bg-indigo-50 text-indigo-600 text-[9px] rounded-md font-bold truncate max-w-[150px]">
                                                                        {note.taskTitle}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-700 pl-2 border-l-2 border-slate-100 group-hover:border-indigo-200 transition-colors py-0.5 whitespace-pre-wrap leading-relaxed">{renderTextWithLinks(note.content)}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                            <div className="mb-3">
                                                                <span className="text-3xl inline-block animate-bounce">📝</span>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-slate-600 mb-1">작성된 과제 메모가 없습니다</h4>
                                                            <p className="text-[10px] text-slate-500">체크리스트의 연필 아이콘을 눌러<br/>학생을 위한 메모를 남겨보세요.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2" id="export-hide-area">
                            <button onClick={handleOpenCounselingAI} className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100 flex items-center gap-1.5 text-sm font-bold shadow-sm"><Icon d={PATHS.heart} size={16}/> <span className="hidden md:inline">AI 상담소</span></button>
                            <button onClick={handleOpenStudentRecordAI} className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 flex items-center gap-1.5 text-sm font-bold shadow-sm"><Icon d={PATHS.document} size={16}/> <span className="hidden md:inline">총평 초안</span></button>
                            <button onClick={handlePrepareReport} disabled={isGenerating} className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors border border-transparent flex items-center gap-1.5 text-sm font-bold shadow-sm"><Icon d={PATHS.edit} size={16}/> <span className="hidden md:inline">리포트 작성</span></button>
                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group"><Icon d={PATHS.x} size={20} className="transition-transform duration-300 group-hover:rotate-90" /></button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-6 bg-slate-50/30">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">
                    
                    <div className="lg:col-span-5 space-y-8 flex flex-col">
                        
                        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-all hover:shadow-md">
                            <h4 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2"><Icon d={PATHS.chart} size={18} className="text-indigo-500"/> 자주 놓치는 과목</h4>
                            {missedTags.length > 0 ? (
                                <div className="space-y-3">
                                    {missedTags.map(([tag, count], i) => {
                                        const maxCount = missedTags[0][1];
                                        const width = (count / maxCount) * 100;
                                        const rankColor = i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-orange-400' : 'bg-amber-400';
                                        const barColor = i === 0 ? 'bg-rose-400' : i === 1 ? 'bg-orange-300' : 'bg-amber-300';
                                        const bgColor = i === 0 ? 'bg-rose-50' : i === 1 ? 'bg-orange-50' : 'bg-amber-50';
                                        return (
                                            <div key={tag} className={`relative p-3 rounded-xl border border-slate-100 ${bgColor} animate-fade-in`} style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${rankColor}`}>{i+1}</span>
                                                        <span className="text-sm font-bold text-slate-700">{tag}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{count}회</span>
                                                </div>
                                                <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${width}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-2">
                                    <div className="mb-3">
                                        <span className="text-3xl inline-block animate-bounce">🎉</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-1">미흡한 과목이 없습니다</h4>
                                    <p className="text-xs text-slate-500">모든 과목을 훌륭하게 수행하고 있어요!</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition-all hover:shadow-md active:scale-[0.99] group" onClick={() => setShowDetailStats(!showDetailStats)}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-base font-bold text-slate-700 flex items-center gap-2"><Icon d={PATHS.users} size={18} className="text-blue-500"/> 학급 평균 비교</h4>
                                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <span>{showDetailStats ? '접기' : '자세히 보기'}</span>
                                    <Icon d={PATHS.right} size={14} className={`transition-transform duration-300 ${showDetailStats ? 'rotate-90' : ''}`} />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 font-bold mb-1">전체 점수 비교</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-2xl font-black ${getLevelTextColor(level)}`}><AnimatedNumber value={reportStats.studentScore} decimals={1} />점</span>
                                            <span className="text-xs text-slate-400 font-medium">vs <AnimatedNumber value={reportStats.classScore} decimals={1} />점 (학급)</span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-xs font-bold text-slate-500">수행률:</span>
                                            <span className={`text-sm font-black ${reportStats.studentRate >= reportStats.classRate ? 'text-indigo-500' : 'text-rose-500'}`}><AnimatedNumber value={reportStats.studentRate} decimals={0} />%</span>
                                            <span className="text-[10px] text-slate-400">(학급 <AnimatedNumber value={reportStats.classRate} decimals={0} />%)</span>
                                        </div>
                                    </div>
                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 ${reportStats.studentScore >= reportStats.classScore ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                        <span className="text-[10px] font-bold opacity-60">GAP</span>
                                        <span className="text-xl font-black leading-none">
                                            {reportStats.studentScore >= reportStats.classScore ? '+' : ''}{(reportStats.studentScore - reportStats.classScore).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 relative z-10">
                                    <div className="relative">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 px-1">
                                            <span>나 ({student.name})</span>
                                        </div>
                                        <div className="h-3 bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
                                            <div className={`h-full ${getLevelColor(level)} transition-all duration-1000 relative`} style={{ width: `${animatedWidths.student}%` }}>
                                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
                                            <span>학급 평균</span>
                                        </div>
                                        <div className="h-3 bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
                                            <div className="h-full bg-slate-300 transition-all duration-1000 relative" style={{ width: `${animatedWidths.class}%` }}>
                                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* [New] 점수 상세 분석 */}
                            <div className="mt-3 text-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowScoreAnalysis(!showScoreAnalysis); }} 
                                    className="text-[10px] text-slate-400 font-bold hover:text-indigo-500 underline decoration-dashed underline-offset-4"
                                >
                                    {showScoreAnalysis ? "점수 분석 닫기" : "내 점수는 어떻게 계산됐나요?"}
                                </button>
                                
                                {showScoreAnalysis && (
                                    <div className="mt-3 bg-white border border-slate-100 rounded-xl p-3 text-xs animate-fade-in shadow-sm">
                                        <div className="flex justify-between items-center mb-1 text-slate-600">
                                            <span>✅ 정상 제출 (+0.5점/건)</span>
                                            <span className="font-bold text-indigo-500">+{reportStats.scoreDetails?.gained || 0}점</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2 text-slate-600">
                                            <span>⚠️ 지각/미제출 (최대 -3점/건)</span>
                                            <span className="font-bold text-rose-500">{reportStats.scoreDetails?.lost ? `-${reportStats.scoreDetails.lost}` : '0'}점</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-tight text-left mb-3">
                                            * 마감일 내 제출 시 0.5점씩 오르고,<br/> 미제출 기간이 길어질수록 감점이 커집니다.
                                        </div>
                                        
                                        {/* Task Details List */}
                                        <div className="border-t border-slate-100 pt-3 max-h-60 overflow-y-auto custom-scroll" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-bold text-slate-700 text-left flex items-center gap-1">
                                                    <Icon d={PATHS.list} size={12} /> 상세 내역 및 점수 수정
                                                </h5>
                                                <span className="text-[9px] text-slate-400 font-medium">* 클릭하여 상태 변경</span>
                                            </div>
                                            <div className="space-y-2">
                                                {reportStats.taskDetails?.length > 0 ? reportStats.taskDetails.map((td, idx) => (
                                                    <div key={`${td.date}-${td.idx}`} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                                        <div className="flex flex-col text-left max-w-[55%]">
                                                            <span className="text-[10px] font-bold text-slate-400">{dayjs(td.date).format('MM/DD')}</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-bold text-slate-700 truncate" title={td.title}>{td.title}</span>
                                                                {td.comment && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setExpandedComments(prev => ({...prev, [`${td.date}-${td.idx}`]: !prev[`${td.date}-${td.idx}`]})); }} className="text-slate-400 hover:text-indigo-500 transition-colors flex-shrink-0">
                                                                        <Icon d={PATHS.right} size={12} className={`transition-transform duration-200 ${expandedComments[`${td.date}-${td.idx}`] ? 'rotate-90' : ''}`} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {td.comment && expandedComments[`${td.date}-${td.idx}`] && (
                                                                <div className="text-[10px] text-slate-500 mt-1 whitespace-pre-wrap border-l-2 border-indigo-200 pl-1.5 py-0.5 animate-fade-in bg-white/50 rounded-r" onClick={(e) => e.stopPropagation()}>
                                                                    {renderTextWithLinks(Array.isArray(td.comment) ? td.comment.join('\n') : td.comment)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className={`text-[10px] font-bold w-8 text-right ${td.status === 'on-time' ? 'text-indigo-500' : td.status === 'late' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                                {td.status === 'missed' ? `-${td.penalty}점` : `+${td.gained}점`}
                                                            </span>
                                                            <select
                                                                value={td.status}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleTaskStatusChange(td.date, td.idx, e.target.value);
                                                                }}
                                                                className={`w-[76px] py-1 pl-1.5 pr-4 text-center rounded text-[10px] font-bold transition-all shadow-sm outline-none appearance-none cursor-pointer border focus:ring-2 focus:ring-offset-1 ${
                                                                    td.status === 'on-time' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 focus:ring-indigo-400' :
                                                                    td.status === 'late' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 focus:ring-amber-400' :
                                                                    'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 focus:ring-rose-400'
                                                                }`}
                                                                style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${td.status === 'on-time' ? '%234338ca' : td.status === 'late' ? '%23b45309' : '%23be123c'}' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                                    backgroundRepeat: 'no-repeat',
                                                                    backgroundPosition: 'right 2px center',
                                                                    backgroundSize: '12px'
                                                                }}
                                                            >
                                                                <option value="on-time" className="text-indigo-700 font-bold bg-white">정상 제출</option>
                                                                <option value="late" className="text-amber-700 font-bold bg-white">지각 제출</option>
                                                                <option value="missed" className="text-rose-700 font-bold bg-white">미제출</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-2">
                                                        <div className="mb-3">
                                                            <span className="text-3xl inline-block animate-bounce">📋</span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-slate-700 mb-1">과제 제출 기록이 없습니다</h4>
                                                        <p className="text-[10px] text-slate-500">과제를 부여하고 제출 상태를 기록해보세요.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {showDetailStats && reportStats.tagStats && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-end mb-3">
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button onClick={(e) => { e.stopPropagation(); setChartType('bar'); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>막대 그래프</button>
                                            <button onClick={(e) => { e.stopPropagation(); setChartType('radar'); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartType === 'radar' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>방사형 차트</button>
                                        </div>
                                    </div>
                                    {chartType === 'bar' ? (
                                        Object.entries(reportStats.tagStats)
                                        .filter(([tag, stat]) => stat.cDone > 0)
                                        .sort((a,b) => b[1].sTotal - a[1].sTotal).map(([tag, stat], idx) => {
                                            const sRate = stat.sTotal > 0 ? Math.round((stat.sDone / stat.sTotal) * 100) : 0;
                                            const cRate = stat.cTotal > 0 ? Math.round((stat.cDone / stat.cTotal) * 100) : 0;
                                            const isLow = cRate - sRate >= 20;
                                            const isHigh = sRate > cRate;
                                            return (
                                                <div key={tag} className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                                    <div className="flex justify-between text-xs mb-2 font-bold text-slate-600">
                                                        <div className="flex items-center gap-1.5"><span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">{tag}</span>{isHigh && <span className="text-[10px] text-orange-500 animate-pulse">훌륭해요! 🎉</span>}</div>
                                                        <div className="flex gap-3"><span className={isLow ? "text-rose-500" : getLevelTextColor(level)}>나 {sRate}%</span><span className="text-slate-400">반 {cRate}%</span></div>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full"><div className={`h-full ${isLow ? "bg-rose-400" : getLevelColor(level)}`} style={{ width: `${sRate}%` }}></div></div>
                                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full"><div className="h-full bg-slate-300" style={{ width: `${cRate}%` }}></div></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : <RadarChart data={reportStats.tagStats} />}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="lg:col-span-7 space-y-8 flex flex-col h-full">

                        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between hover:border-indigo-300 transition-all hover:shadow-md relative z-30">
                            <div className="flex flex-col">
                                <h4 className="text-base font-bold text-slate-700 mb-1 flex items-center gap-2"><span className="text-xl">🌟</span> 칭찬 스티커</h4>
                                <span className="text-xs text-slate-500 font-medium">긍정적 강화와 보상</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Btn onClick={(e) => handleSticker(-1, e)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold text-lg">-</Btn>
                                <div className="relative">
                                    <span 
                                        onClick={(e) => { e.stopPropagation(); setShowStickerHistory(!showStickerHistory); }}
                                        className={`text-4xl font-black text-yellow-500 w-16 text-center transition-transform duration-200 cursor-pointer hover:scale-110 inline-block ${stickerEffect ? 'scale-150 text-orange-500' : ''}`}
                                        title="기록 보기"
                                    >
                                        {stickerCount}
                                    </span>
                                    {showStickerHistory && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                                <h5 className="text-xs font-bold text-slate-600">📜 최근 칭찬 기록</h5>
                                                <button onClick={() => setShowStickerHistory(false)} className="text-slate-400 hover:text-slate-600"><Icon d={PATHS.x} size={12}/></button>
                                            </div>
                                            <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll">
                                                {combinedNotes.filter(n => n.content && (n.content.includes('칭찬') || n.content.includes('스티커') || n.content.includes('상점'))).slice(0, 5).map((n, idx) => (
                                                    <div key={n.id} className="text-xs animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 rounded">{dayjs(n.date).format('MM/DD')}</span>
                                                            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                                        </div>
                                                        <p className="text-slate-700 pl-1 border-l-2 border-slate-100 ml-1 py-0.5">{n.content}</p>
                                                    </div>
                                                ))}
                                                {combinedNotes.filter(n => n.content && (n.content.includes('칭찬') || n.content.includes('스티커') || n.content.includes('상점'))).length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-8 px-2 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                        <div className="mb-2">
                                                            <span className="text-3xl inline-block animate-bounce">🌟</span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-slate-700 mb-1">칭찬 기록이 없습니다</h4>
                                                        <p className="text-[10px] text-slate-500">따뜻한 칭찬 한마디를 남겨주세요.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1.5 w-3 h-3 bg-white border-t border-l border-slate-100 transform rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                                <Btn onClick={(e) => handleSticker(1, e)} className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 font-bold text-lg shadow-sm">+</Btn>
                            </div>
                        </div>

                        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 hover:border-indigo-300 transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-base font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 items-start">
                                    <span className="flex items-center gap-2 whitespace-nowrap"><Icon d={PATHS.document} size={18} className="text-green-500"/> 교사 관찰 및 칭찬 기록</span>
                                    <div className="flex flex-col sm:flex-row gap-1">
                                        {hasNotionConfig && <span className="w-fit text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-normal flex items-center gap-0.5 whitespace-nowrap"><Icon d={PATHS.check} size={10} strokeWidth={3} />노션 연동</span>}
                                        {hasGoogleSheetConfig && <span className="w-fit text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-normal flex items-center gap-0.5 whitespace-nowrap"><Icon d={PATHS.check} size={10} strokeWidth={3} />구글 연동</span>}
                                    </div>
                                </h4>
                            </div>

                            <div className="flex flex-col gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                                <div className="flex flex-wrap gap-1.5 mb-1 relative">
                                    {selectedStudents.map(s => (
                                        <span key={s.id} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-sm">
                                            {s.name}
                                            {s.id !== student.id && <button onClick={() => removeSelectedStudent(s.id)} className="hover:text-rose-500 bg-indigo-100 rounded-full p-0.5"><Icon d={PATHS.x} size={10}/></button>}
                                        </span>
                                    ))}
                                </div>

                                {(hasNotionRecord || hasNotionPortfolio || hasGoogleSheet) ? (
                                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                                        {hasNotionRecord && <button onClick={() => { const next = new Set(saveTargets); if(next.has('notion_record')) next.delete('notion_record'); else next.add('notion_record'); setSaveTargets(next); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${saveTargets.has('notion_record') ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>📝 노션(기록)</button>}
                                        {hasNotionPortfolio && <button onClick={() => { const next = new Set(saveTargets); if(next.has('notion_portfolio')) next.delete('notion_portfolio'); else next.add('notion_portfolio'); setSaveTargets(next); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${saveTargets.has('notion_portfolio') ? 'bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100' : 'text-slate-400 hover:bg-slate-50'}`}>📁 노션(포폴)</button>}
                                        {hasGoogleSheet && <button onClick={() => { const next = new Set(saveTargets); if(next.has('google_sheet')) next.delete('google_sheet'); else next.add('google_sheet'); setSaveTargets(next); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${saveTargets.has('google_sheet') ? 'bg-green-50 text-green-600 shadow-sm ring-1 ring-green-100' : 'text-slate-400 hover:bg-slate-50'}`}>📊 구글 시트</button>}
                                    </div>
                                ) : (
                                    <div className="text-center text-xs text-slate-400 py-2 bg-slate-50 rounded-xl border border-slate-200 border-dashed">연동된 외부 서비스가 없습니다 (로컬에만 저장됩니다)</div>
                                )}

                                <div className="flex items-center gap-2 relative z-20">
                                    <div className="flex-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Icon d={PATHS.search} size={14} className="text-slate-400" />
                                        </div>
                                        <input 
                                            placeholder="다른 학생 함께 태그하기..." 
                                            className="w-full p-2.5 pl-9 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" 
                                            value={searchText}
                                            onChange={(e) => { setSearchText(e.target.value); setShowStudentDropdown(true); }}
                                            onFocus={() => setShowStudentDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                                        />
                                        {showStudentDropdown && (
                                            <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-slate-200 rounded-xl z-50 max-h-48 overflow-y-auto mt-2 custom-scroll py-1 animate-fade-in">
                                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border-b border-slate-100 mb-1">학생 검색</div>
                                                {students.filter(s => s.name.includes(searchText)).sort((a, b) => a.name.localeCompare(b.name)).map((s, idx) => (
                                                    <div 
                                                        key={s.id} 
                                                        className="px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center animate-fade-in"
                                                        style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                                                        onMouseDown={() => { handleStudentSelect(s.name); setSearchText(""); }}
                                                    >
                                                        <span className="font-bold flex items-center gap-2"><span className="text-[10px] text-slate-400 font-normal">{s.order}번</span> {s.name}</span>
                                                        {selectedStudents.find(sel => sel.id === s.id) && <Icon d={PATHS.check} size={12} className="text-indigo-500 bg-indigo-100 rounded-full p-0.5"/>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input type="date" value={notionDate} onChange={(e) => setNotionDate(e.target.value)} className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm" />
                                </div>
                                
                                <textarea 
                                    value={notionContent}
                                    onChange={(e) => setNotionContent(e.target.value)}
                                    className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none h-24 placeholder-slate-400 shadow-sm"
                                    placeholder="관찰한 내용이나 칭찬할 내용을 입력하세요..."
                                />
                                
                                <div className="flex justify-end -mt-1">
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input type="checkbox" checked={keepContent} onChange={e => setKeepContent(e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500" />
                                        <span className="text-[10px] text-slate-500 font-bold hover:text-slate-700">저장 후 내용 유지</span>
                                    </label>
                                </div>
                                
                                {notionStatus === 'saving' ? (
                                    <div className="w-full bg-indigo-50 rounded-xl h-12 flex items-center justify-center relative overflow-hidden shadow-inner ring-2 ring-indigo-200 animate-pulse">
                                        <div className="absolute left-0 top-0 h-full bg-indigo-100 transition-all duration-300 ease-out" style={{ width: `${saveProgress}%` }}></div>
                                        <div className="relative z-10 flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                            <Icon d={PATHS.spinner} className="animate-spin" />
                                            <span>저장 중... {saveProgress}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2.5">
                                        <button onClick={(e) => handleIntegratedSave('칭찬', e)} className="relative flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap bg-rose-500 hover:bg-rose-600 active:scale-95">
                                            칭찬하기 +1
                                        </button>
                                        <button onClick={(e) => handleIntegratedSave('관찰', e)} className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 active:scale-95">
                                            관찰 기록 저장
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4 flex gap-2 relative">
                                
                                <div className="relative flex-1">
                                    <Icon d={PATHS.search} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="내용 또는 달력에서 날짜 선택..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                                
                                <button
                                    onClick={() => setShowSearchCal(!showSearchCal)}
                                    className="p-2 border border-slate-200 bg-slate-50 rounded-xl hover:bg-indigo-50 text-slate-500 transition-colors"
                                    title="달력으로 날짜 찾기"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>

                                {selectedDate && (
                                    <button onClick={() => setSelectedDate(null)} className="px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                        {dayjs(selectedDate).format('MM/DD')} <Icon d={PATHS.x} size={12}/>
                                    </button>
                                )}

                                {showSearchCal && (
                                    <div className="absolute top-12 right-0 mt-1 bg-white border border-slate-100 shadow-2xl shadow-indigo-100/50 rounded-3xl p-4 z-50 w-72 animate-fade-in">
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <button onClick={() => setCalMonth(calMonth.subtract(1, 'month'))} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Icon d={PATHS.left} size={16} /></button>
                                            <span className="font-extrabold text-sm text-slate-800">{calMonth.format('YYYY년 M월')}</span>
                                            <button onClick={() => setCalMonth(calMonth.add(1, 'month'))} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Icon d={PATHS.right} size={16} /></button>
                                        </div>
                                        <div className="grid grid-cols-7 mb-2 text-center">
                                            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                                                <div key={d} className={`text-[10px] font-bold pb-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                            {Array.from({ length: calMonth.startOf('month').day() }).map((_, i) => <div key={`empty-${i}`} />)}
                                            {Array.from({ length: calMonth.daysInMonth() }).map((_, i) => {
                                                const dateStr = calMonth.date(i + 1).format('YYYY-MM-DD');
                                                const hasRecord = recordDates.includes(dateStr); 
                                                const isSelected = searchTerm === dateStr;
                                                const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                                                
                                                let cellClass = "aspect-square flex flex-col items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-all duration-200 relative group";
                                                if (isSelected) cellClass += " bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold transform scale-105 z-10";
                                                else if (isToday) cellClass += " text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100";
                                                else cellClass += " text-slate-600 hover:bg-slate-100";

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setSearchTerm(dateStr); 
                                                            setShowSearchCal(false); 
                                                        }}
                                                        className={cellClass}
                                                    >
                                                        <span>{i + 1}</span>
                                                        {hasRecord && !isSelected && <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-indigo-400' : 'bg-blue-400'}`}></div>}
                                                        {isSelected && (
                                                            <div className="absolute -top-0.5 -right-0.5 bg-white text-indigo-600 rounded-full p-[1px] shadow-sm animate-bounce-in z-20"><Icon d={PATHS.check} size={8} strokeWidth={4} /></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scroll pr-1 max-h-[400px]">
                                {displayedNotes.length > 0 ? (
                                    <div className="relative space-y-7 py-2">
                                        {Object.entries(displayedNotes.reduce((acc, note) => {
                                            if (!acc[note.date]) acc[note.date] = [];
                                            acc[note.date].push(note);
                                            return acc;
                                        }, {})).sort((a, b) => b[0].localeCompare(a[0])).map(([date, groupNotes], dateIndex, dateArray) => {
                                            
                                            const isLastDate = dateIndex === dateArray.length - 1;

                                            const isExpanded = expandedDates[date];
                                            const showExpandBtn = groupNotes.length > 2;
                                            const visibleNotes = showExpandBtn && !isExpanded ? groupNotes.slice(0, 2) : groupNotes;

                                            return (
                                                <div key={date} className="flex w-full animate-fade-in" style={{ animationDelay: `${dateIndex * 0.05}s`, animationFillMode: 'both' }}>
                                                    
                                                    <div className="w-12 flex flex-col items-end shrink-0 pt-1 pr-1.5">
                                                        <div className="text-xs font-bold text-slate-600 text-right leading-tight">
                                                            {dayjs(date).format('MM.DD')}
                                                            <br/>
                                                            <span className="text-[10px] text-slate-400">{dayjs(date).format('dddd')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="relative w-3 flex flex-col items-center shrink-0 pt-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 z-10 shadow-sm border-2 border-white"></div>
                                                        
                                                        {!isLastDate && (
                                                            <div className="absolute top-2.5 bottom-[-40px] w-[1.5px] bg-indigo-200"></div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 pl-2 pr-2">
                                                        {visibleNotes.map((note, noteIndex) => {
                                                            const isLastVisible = noteIndex === visibleNotes.length - 1;
                                                            const isEditing = editingNoteId === note.id;

                                                            return (
                                                                <div key={note.id} className="flex flex-col">
                                                                    
                                                                    {isEditing ? (
                                                                        <div className="w-full bg-white border-2 border-indigo-400 rounded-xl p-3 shadow-md animate-fade-in mb-2">
                                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-sm">
                                                                                    {student.name}
                                                                                </span>
                                                                                {editRelatedStudents.map(s => (
                                                                                    <span key={s.id} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border bg-white text-slate-600 border-slate-200 font-bold shadow-sm">
                                                                                        {s.name}
                                                                                        <button onClick={() => handleRemoveEditStudent(s.id)} className="hover:text-rose-500"><Icon d={PATHS.x} size={10}/></button>
                                                                                    </span>
                                                                                ))}
                                                                                <div className="relative">
                                                                                    <input 
                                                                                        placeholder="+ 학생 추가" 
                                                                                        className="w-24 p-1 text-xs border-b border-slate-300 outline-none focus:border-indigo-500 bg-transparent"
                                                                                        value={editSearchText}
                                                                                        onChange={(e) => { setEditSearchText(e.target.value); setShowEditStudentDropdown(true); }}
                                                                                        onFocus={() => setShowEditStudentDropdown(true)}
                                                                                        onBlur={() => setTimeout(() => setShowEditStudentDropdown(false), 200)}
                                                                                    />
                                                                                    {showEditStudentDropdown && (
                                                                                        <div className="absolute top-full right-0 w-32 bg-white shadow-xl border border-slate-200 rounded-lg z-50 max-h-32 overflow-y-auto mt-1 custom-scroll">
                                                                                            {students.filter(s => s.name.includes(editSearchText) && s.id !== student.id && !editRelatedStudents.some(rs => rs.id === s.id)).map(s => (
                                                                                                <div key={s.id} className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer font-bold" onMouseDown={() => handleAddEditStudent(s)}>
                                                                                                    {s.name}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <textarea 
                                                                                value={editNoteContent}
                                                                                onChange={(e) => setEditNoteContent(e.target.value)}
                                                                                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none h-24 mb-2"
                                                                            />
                                                                            <div className="flex justify-end gap-2">
                                                                                <Btn onClick={() => { setEditingNoteId(null); setEditNoteContent(""); setEditRelatedStudents([]); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">취소</Btn>
                                                                                <Btn onClick={saveEditing} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm">저장</Btn>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`group w-full border rounded-xl p-3 text-xs text-slate-700 shadow-sm transition-colors ${note.isTaskComment ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                                                                                    {note.isTaskComment && (
                                                                                        <span className="px-1.5 py-0.5 border border-indigo-200 bg-indigo-100 text-indigo-700 text-[8px] rounded-full font-bold shadow-sm flex items-center gap-1">
                                                                                            <Icon d={PATHS.message} size={10} /> 과제: {note.taskTitle}
                                                                                        </span>
                                                                                    )}
                                                                                    {note.destTags && note.destTags.map((tag, idx) => {
                                                                                         let dotColor = "bg-slate-300";
                                                                                        if (tag === '노션(기록)') dotColor = "bg-blue-400";
                                                                                        else if (tag === '노션(포폴)') dotColor = "bg-yellow-400";
                                                                                        else if (tag === '구글 시트') dotColor = "bg-green-400";
                                                                                        return <div key={idx} className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} title={tag}></div>;
                                                                                    })}
                                                                                    {(() => {
                                                                                        const related = note.relatedStudents ? note.relatedStudents.filter(s => s.id !== student.id) : [];
                                                                                        if (related.length === 0) return null;
                                                                                      return (
                                                                                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                                                                                            <span className="text-[8px] text-slate-400 shrink-0">with</span>
                                                                                            {related.map((s, idx) => (
                                                                                                <div key={idx} className="flex items-center shrink-0">
                                                                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] rounded-full font-bold cursor-pointer hover:bg-slate-200 border border-slate-200 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onSwitchStudent(s.id); }}>
                                                                                                        {s.name}
                                                                                                    </span>
                                                                                                    {idx < related.length - 1 && <span className="text-[8px] text-slate-400 ml-0.5">,</span>}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                </div>
                                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 ml-2">
                                                                                    <button onClick={() => { navigator.clipboard.writeText(note.content); showToast("내용이 복사되었습니다."); }} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="복사">
                                                                                        <Icon d={PATHS.copy} size={14} />
                                                                                    </button>
                                                                                    <button onClick={() => startEditing(note)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="수정">
                                                                                        <Icon d={PATHS.edit} size={14} />
                                                                                    </button>
                                                                                    <button onClick={() => handleDeleteNote(note.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="삭제">
                                                                                        <Icon d={PATHS.trash} size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                                                {note.content}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {!isLastVisible && (
                                                                        <div className="flex justify-center w-full py-1">
                                                                            <div className="h-5 border-l-2 border-dashed border-slate-200"></div>
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            );
                                                        })}
                                                        {showExpandBtn && (
                                                            <button 
                                                                onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                                                                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1 mt-2"
                                                            >
                                                                {isExpanded ? (
                                                                    <>접기 <Icon d={PATHS.down} size={12} className="rotate-180" /></>
                                                                ) : (
                                                                    <>+{groupNotes.length - 2}개 더 보기 <Icon d={PATHS.down} size={12} /></>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 mt-2">
                                        <div className="mb-4">
                                            <span className="text-4xl inline-block animate-bounce">📂</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-700 mb-1">아직 기록이 없습니다</h4>
                                        <p className="text-xs text-slate-500">관찰 및 칭찬 내용을 입력하여 첫 기록을 남겨보세요.</p>
                                    </div>
                                )}
                                {hasMore && (
                                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-3 shadow-sm">
                                        {isExpanded ? '접기' : `과거 기록 ${filteredNotes.length - 2}개 더 보기`} 
                                        <Icon d={PATHS.down} size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 grid-rows-1">
                                
                                <div className={`col-start-1 row-start-1 w-full transition-all duration-300 ease-in-out transform ${isDetailViewOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible pointer-events-none'}`}>
                                    {(selectedGrassDate || cachedDetailDate) && (() => {
                                        const detailDate = selectedGrassDate || cachedDetailDate;
                                        const dayData = grassHistory.find(h => h.date === detailDate);
                                        const ratio = dayData?.ratio || 0;

                                        return (
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                                    <button onClick={() => setIsDetailViewOpen(false)} className="group flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors pr-2">
                                                        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-100 transition-all">
                                                            <Icon d={PATHS.left} size={16} />
                                                        </div>
                                                        <span className="text-xs font-bold">목록으로</span>
                                                    </button>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-black text-slate-800 tracking-tight">{dayjs(detailDate).format('M월 D일 dddd')}</span>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ratio === 1 ? '#4ade80' : ratio > 0 ? '#facc15' : '#e2e8f0' }}></div>
                                                            <span className="text-xs font-bold text-slate-500">수행률 {Math.round(ratio * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-8">
                                                    <section>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">📝</span>
                                                                <h4 className="text-sm font-extrabold text-slate-700">과제 체크리스트</h4>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                {dayData?.count || 0}/{dayData?.total || 0} 완료
                                                            </span>
                                                        </div>
                                                        {(dailyTasks[detailDate] || []).length > 0 ? (
                                                            <div className="grid gap-2">
                                                                {(dailyTasks[detailDate] || []).map((t, i) => {
                                                                    const title = typeof t === 'object' ? t.title : t;
                                                                    const tag = typeof t === 'object' ? t.tag : '기타';
                                                                    const rec = records[detailDate]?.[student.id];
                                                                    const isDone = rec ? (rec.tasks ? rec.tasks[i] : rec.done) : false;
                                                                    const comment = rec?.taskComments?.[i] || '';
                                                                    const isEditingComment = openCommentIndex === i;
                                                                    return (
                                                                        <div key={i} className={`flex flex-col p-3 rounded-2xl border-2 transition-all duration-200 animate-fade-in ${isDone ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`} style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                                                                            <div className="flex items-center">
                                                                                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-3 transition-colors ${isDone ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                                                                    <Icon d={PATHS.check} size={14} strokeWidth={4} />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isDone ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{tag}</span>
                                                                                    </div>
                                                                                    <p className={`text-sm font-bold truncate ${isDone ? 'text-slate-700' : 'text-slate-500'}`}>{title}</p>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        if (isEditingComment) {
                                                                                            setOpenCommentIndex(null);
                                                                                        } else {
                                                                                            setOpenCommentIndex(i);
                                                                                            setCommentInput(comment);
                                                                                        }
                                                                                    }}
                                                                            className={`p-1.5 rounded-full transition-all ml-2 shrink-0 ${comment ? 'border-2 border-blue-400' : 'border-2 border-transparent'} hover:bg-slate-100`}
                                                                                    title="메모 남기기"
                                                                                >
                                                                                    <Icon d={PATHS.edit} size={14} className="text-slate-400" />
                                                                                </button>
                                                                            </div>
                                                                            
                                                                            {comment && !isEditingComment && (
                                                                                <div className="mt-2 pl-9 flex items-center gap-2 group">
                                                                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg flex-1 whitespace-pre-wrap">{renderTextWithLinks(comment)}</p>
                                                                                    <button 
                                                                                        onClick={() => { navigator.clipboard.writeText(comment); showToast("메모가 복사되었습니다."); }} 
                                                                                        className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                        title="메모 복사"
                                                                                    >
                                                                                        <Icon d={PATHS.copy} size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            {isEditingComment && (
                                                                                <div className="mt-2 pl-9 space-y-2 animate-fade-in">
                                                                                    <textarea 
                                                                                        value={commentInput}
                                                                                        onChange={(e) => setCommentInput(e.target.value)}
                                                                                        className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 resize-none"
                                                                                        rows={3}
                                                                                        placeholder="과제에 대한 메모를 남겨보세요..."
                                                                                        autoFocus
                                                                                    />
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button onClick={() => setOpenCommentIndex(null)} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold hover:bg-slate-200">취소</button>
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                onSaveTaskComment(student.id, i, commentInput.trim() || null, detailDate);
                                                                                                setOpenCommentIndex(null);
                                                                                                showToast("메모가 저장되었습니다.");
                                                                                            }} 
                                                                                            className="px-2 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold hover:bg-indigo-700"
                                                                                        >
                                                                                            저장
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 gap-3">
                                                                <div className="mb-2">
                                                                    <span className="text-4xl inline-block animate-bounce">📭</span>
                                                                </div>
                                                                <div className="text-center">
                                                                    <h4 className="text-sm font-bold text-slate-700 mb-1">등록된 과제가 없습니다</h4>
                                                                    <p className="text-[10px] text-slate-500">이 날짜에는 부여된 과제가 없어요.</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </section>

                                                    {notes.filter(n => n.date === detailDate).length > 0 && (
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-lg">💬</span>
                                                                <h4 className="text-sm font-extrabold text-slate-700">선생님 기록</h4>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {notes.filter(n => n.date === detailDate).map((n, idx) => (
                                                                    <div key={n.id} className="relative bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                                                        <div className="absolute top-4 left-0 w-1 h-8 bg-amber-400 rounded-r-full"></div>
                                                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-2">{n.content}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className={`col-start-1 row-start-1 w-full transition-all duration-300 ease-in-out transform ${isDetailViewOpen ? '-translate-x-full opacity-0 invisible pointer-events-none' : 'translate-x-0 opacity-100 visible'}`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
                                        <h4 className="text-base font-bold text-slate-700 flex items-center gap-2 whitespace-nowrap">
                                            <Icon d={PATHS.calendar} size={18} className="text-orange-500"/> 활동 잔디 
                                            <span className="text-indigo-600 font-extrabold text-xs bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap">{dayjs(grassStart).format('YYYY년 M월')}</span>
                                            <div className="relative ml-1 flex items-center">
                                                <button onClick={(e) => { e.stopPropagation(); setShowThemePicker(!showThemePicker); }} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors" title="강조 색상 변경">
                                                    <div className={`w-4 h-4 rounded-full ${GRASS_THEMES[grassTheme].bg} border-2 ${GRASS_THEMES[grassTheme].border}`}></div>
                                                </button>
                                                {showThemePicker && (
                                                    <div className="absolute top-full left-0 mt-2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 z-50 flex gap-1.5 animate-fade-in w-max" onClick={(e) => e.stopPropagation()}>
                                                        {Object.entries(GRASS_THEMES).map(([key, theme]) => (
                                                            <button key={key} onClick={() => { setGrassTheme(key); localStorage.setItem('cls_grass_theme', key); setShowThemePicker(false); }} className={`w-6 h-6 rounded-full ${theme.bg} border-2 ${theme.border} hover:scale-110 transition-transform ring-1 ring-offset-1 ${grassTheme === key ? 'ring-slate-400' : 'ring-transparent'}`}></button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </h4>
                                        <div className="flex flex-col items-end sm:items-center gap-1 w-full sm:w-auto">
                                            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                                                <button onClick={() => { const prev = dayjs(grassStart).subtract(1, 'month'); setGrassStart(prev.startOf('month').format('YYYY-MM-DD')); setGrassEnd(prev.endOf('month').format('YYYY-MM-DD')); setIsGrassExpanded(true); }} className="p-1 hover:bg-white rounded-md text-slate-500 shadow-sm transition-all"><Icon d={PATHS.left} size={12}/></button>
                                                <button onClick={() => { const now = dayjs(); setGrassStart(now.startOf('month').format('YYYY-MM-DD')); setGrassEnd(now.endOf('month').format('YYYY-MM-DD')); setIsGrassExpanded(false); setDateRangeAnim(true); setTimeout(() => setDateRangeAnim(false), 500); }} className="text-[10px] px-2.5 py-1 rounded-md font-bold text-slate-600 hover:bg-white shadow-sm transition-all whitespace-nowrap">이번 달</button>
                                                <button onClick={() => { const next = dayjs(grassStart).add(1, 'month'); setGrassStart(next.startOf('month').format('YYYY-MM-DD')); setGrassEnd(next.endOf('month').format('YYYY-MM-DD')); setIsGrassExpanded(true); }} className="p-1 hover:bg-white rounded-md text-slate-500 shadow-sm transition-all"><Icon d={PATHS.right} size={12}/></button>
                                                <button onClick={() => setIsCalendarOpen(true)} className="p-1 hover:bg-white rounded-md text-slate-500 shadow-sm transition-all ml-1" title="기간 선택"><Icon d={PATHS.calendar} size={12}/></button>
                                            </div>
                                            <span className={`text-xs text-slate-500 font-medium transition-all duration-300 whitespace-nowrap ${dateRangeAnim ? 'text-indigo-600 font-bold scale-110' : ''}`}>{dayjs(grassStart).format('YY.MM.DD')} ~ {dayjs(grassEnd).format('YY.MM.DD')}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-5 gap-y-6 gap-x-2 justify-items-center py-4 mt-2">
                                        {displayedGrass.map((h, i) => {
                                            if (h.isPadding) return <div key={i} className="w-12 h-12 animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}></div>;
                                            const isToday = h.date === todayStr;
                                            const theme = GRASS_THEMES[grassTheme];
                                            const colIndex = i % 5;
                                            let tooltipPos = "left-1/2 -translate-x-1/2";
                                            let arrowPos = "left-1/2 -translate-x-1/2";
                                            if (colIndex === 0) { tooltipPos = "left-0"; arrowPos = "left-6"; }
                                            else if (colIndex === 4) { tooltipPos = "right-0"; arrowPos = "right-6"; }

                                            const hasNoTasks = h.total === 0;

                                            return (
                                            <div key={i} onClick={() => { setSelectedGrassDate(h.date); setIsDetailViewOpen(true); }} className={`flex flex-col items-center gap-0.5 group relative cursor-pointer p-2 rounded-2xl transition-all duration-200 ease-out animate-fade-in ${selectedGrassDate === h.date ? 'bg-white border-2 border-indigo-100 scale-100 md:scale-105 shadow-md z-20' : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-100 hover:scale-110 hover:shadow-lg hover:z-30'}`} style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
                                                {hasNoTasks ? (
                                                    <div className="w-12 h-12 flex items-center justify-center">
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-slate-300 ${isToday ? `ring-4 ${theme.ring} ring-offset-4` : ''}`}></div>
                                                    </div>
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-full shadow-inner flex items-center justify-center relative overflow-hidden bg-slate-100 ${isToday ? `ring-4 ${theme.ring} ring-offset-2` : ''}`} style={getPieStyle(h.ratio)}></div>
                                                )}
                                                <span className={`text-xs ${isToday ? `${theme.text} font-black` : selectedGrassDate === h.date ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>{dayjs(h.date).format('MM/DD')}</span>
                                                <div className={`absolute bottom-full mb-2 z-50 w-max bg-slate-900 text-white rounded-xl px-3 py-2 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 pointer-events-none flex items-center gap-3 ${tooltipPos}`}>
                                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{dayjs(h.date).format('YYYY.MM.DD (ddd)')}</span>
                                                    <div className="w-px h-3 bg-slate-700"></div>
                                                    <div className="flex items-center gap-2 justify-center whitespace-nowrap">
                                                        {hasNoTasks ? (
                                                            <span className="text-xs font-bold text-slate-400">과제 없음</span>
                                                        ) : (
                                                            <>
                                                                <div className={`w-2 h-2 rounded-full ${h.ratio === 1 ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : h.ratio > 0 ? 'bg-yellow-400' : 'bg-slate-600'}`}></div>
                                                                <span className="text-xs font-bold">{Math.round(h.ratio * 100)}%</span>
                                                                <span className="text-[10px] text-slate-500 font-medium">({h.count}/{h.total})</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className={`absolute top-full border-[6px] border-transparent border-t-slate-900 ${arrowPos}`}></div>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                    {grassHistory.length > 5 && (
                                        <button onClick={() => setIsGrassExpanded(!isGrassExpanded)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-4 shadow-sm">
                                            {isGrassExpanded ? '이번 주만 보기' : '이번 달 전체 보기'}
                                            <Icon d={PATHS.down} size={14} className={`transition-transform duration-300 ${isGrassExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                    </div>
                </div>

                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div ref={reportRef} className={`w-[800px] p-12 bg-white text-slate-800 relative ${reportFont === 'serif' ? 'font-serif' : reportFont === 'hand' ? 'font-hand' : reportFont === 'jua' ? 'font-jua' : reportFont === 'nanum' ? 'font-nanum' : reportFont === 'nanum-bold' ? 'font-nanum font-bold' : 'font-sans'}`}>
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                        
                        <div className="text-center mb-10 mt-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-3xl mb-4 shadow-sm">🌱</div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">학습 성장 리포트</h1>
                            <p className="text-slate-500 text-lg font-medium">{dayjs(reportStart).format('YYYY.MM.DD')} ~ {dayjs(reportEnd).format('YYYY.MM.DD')}</p>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-indigo-50/50 border-4 border-white ring-2 ring-indigo-100 flex items-center justify-center text-5xl shadow-md overflow-hidden relative">
                                    {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <span className="drop-shadow-sm group-hover:scale-105 transition-transform">{student.gender === 'M' ? '👦' : '👧'}</span>}
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <h2 className="text-3xl font-black text-slate-800">{student.name}</h2>
                                        <span className="text-lg text-slate-500 font-bold">학생</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">Lv.{level}</span>
                                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">스티커 {stickerCount}개</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-400 mb-1">과제 수행률</div>
                                <div className="text-5xl font-black text-indigo-600">{reportStats.studentRate}%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="border-b border-slate-100 pb-8">
                                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="text-indigo-500">📊</span> 활동 데이터 분석
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="text-sm text-slate-500 font-bold mb-3">학급 평균 비교</div>
                                        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                                            <div className="absolute top-0 left-0 h-full bg-indigo-400" style={{ width: `${reportStats.studentRate}%` }}></div>
                                            <div className="absolute top-0 left-0 h-full w-1 bg-black/10" style={{ left: `${reportStats.classRate}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-400">
                                            <span>나 {reportStats.studentRate}%</span>
                                            <span>학급 평균 {reportStats.classRate}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="text-sm text-slate-500 font-bold mb-3">보완이 필요한 과목</div>
                                        <div className="flex flex-wrap gap-2">
                                            {missedTags.length > 0 ? missedTags.map(([t, c]) => (
                                                <span key={t} className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">{t}</span>
                                            )) : <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg border border-green-100">모든 과목을 잘 수행했습니다! 👏</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {isGenerating ? (
                                    /* [New] AI 리포트 생성 스켈레톤 UI */
                                    <div className="space-y-6 animate-pulse">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ) : !aiComment ? (
                                    <>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <span className="text-indigo-500">📝</span> 선생님의 종합 의견
                                        </h3>
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            내용을 작성해주세요.
                                        </div>
                                    </>
                                ) : aiComment.includes('###') ? (
                                    <div className="space-y-6">
                                        {aiComment.split('###').filter(s => s.trim()).map((section, idx) => {
                                            const lines = section.trim().split('\n');
                                            const title = lines[0].trim();
                                            const content = lines.slice(1).join('\n').trim();
                                            
                                            let cardStyle = "bg-white border-slate-200";
                                            let titleStyle = "text-slate-800";
                                            
                                            if (title.includes("핵심 요약")) { cardStyle = "bg-indigo-50 border-indigo-100"; titleStyle = "text-indigo-800"; }
                                            else if (title.includes("긍정적")) { cardStyle = "bg-amber-50 border-amber-100"; titleStyle = "text-amber-800"; }
                                            else if (title.includes("성장 포인트")) { cardStyle = "bg-emerald-50 border-emerald-100"; titleStyle = "text-emerald-800"; }
                                            else if (title.includes("실천 목표")) { cardStyle = "bg-blue-50 border-blue-100"; titleStyle = "text-blue-800"; }
                                            else if (title.includes("가정 내")) { cardStyle = "bg-rose-50 border-rose-100"; titleStyle = "text-rose-800"; }

                                            return (
                                                <div key={idx} className={`p-6 rounded-2xl border ${cardStyle} shadow-sm`}>
                                                    <h4 className={`text-lg font-extrabold mb-3 ${titleStyle}`}>{title}</h4>
                                                    <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {content}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <span className="text-indigo-500">📝</span> 선생님의 종합 의견
                                        </h3>
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            {aiComment}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-16 text-center border-t border-slate-100 pt-8">
                            <p className="text-slate-400 font-bold text-sm">위 내용은 다했나요? 앱을 통해 데이터 기반으로 작성되었습니다.</p>
                        </div>
                    </div>
                </div>

                {showCounselingAI && (
                    <CounselingAIModal isOpen={showCounselingAI} onClose={() => setShowCounselingAI(false)} student={student} students={students} apiKey={apiKey} showToast={showToast} onSave={handleSaveAIAdvice} notes={notes} />
                )}

                {showStudentRecordAI && (
                    <StudentRecordAIModal isOpen={showStudentRecordAI} onClose={() => setShowStudentRecordAI(false)} student={student} students={students} apiKey={apiKey} showToast={showToast} notes={notes} dailyTasks={dailyTasks} records={records} appConfig={appConfig} onSaveDraft={onSaveRecordDraft} />
                )}

                {showReportEdit && (
                    <div className="fixed inset-0 bg-slate-900/40 z-[1700] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowReportEdit(false)}>
                        <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl p-0 overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Icon d={PATHS.edit} className="text-indigo-500" /> 리포트 작성</h3>
                                <button onClick={() => setShowReportEdit(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><Icon d={PATHS.x} /></button>
                            </div>
                            <div className="p-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-500">분석 기간:</span>
                                    <input type="date" value={reportStart} onChange={e=>setReportStart(e.target.value)} className="text-xs p-1 border rounded bg-white"/>
                                    <span className="text-xs text-slate-400">~</span>
                                    <input type="date" value={reportEnd} onChange={e=>setReportEnd(e.target.value)} className="text-xs p-1 border rounded bg-white"/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                    <div className="flex flex-col gap-1 relative">
                                        <label className="text-[10px] font-bold text-slate-500">글꼴 (Font)</label>
                                        <button 
                                            onClick={() => setShowReportFontList(!showReportFontList)}
                                            className={`w-full p-1.5 border rounded bg-white outline-none focus:border-indigo-500 font-bold text-slate-700 flex justify-between items-center transition-all text-xs ${showReportFontList ? 'ring-2 ring-indigo-100 border-indigo-300' : 'border-slate-200'} ${reportFont === 'serif' ? 'font-serif' : reportFont === 'hand' ? 'font-hand' : reportFont === 'jua' ? 'font-jua' : reportFont === 'nanum' ? 'font-nanum' : reportFont === 'nanum-bold' ? 'font-nanum font-bold' : 'font-sans'}`}
                                        >
                                            <span className="truncate">
                                            {
                                                reportFont === 'sans' ? '기본 고딕' :
                                                reportFont === 'nanum' ? '나눔고딕' :
                                                reportFont === 'nanum-bold' ? '나눔고딕 Bold' :
                                                reportFont === 'serif' ? '나눔명조' :
                                                reportFont === 'jua' ? '주아체' :
                                                reportFont === 'hand' ? '개구체' : '기본 고딕'
                                            }
                                            </span>
                                            <Icon d={PATHS.down} size={12} className={`text-slate-400 flex-shrink-0 transition-transform ${showReportFontList ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showReportFontList && (
                                            <>
                                                <div className="fixed inset-0 z-[1710]" onClick={() => setShowReportFontList(false)}></div>
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-[1720] overflow-hidden max-h-48 overflow-y-auto custom-scroll animate-fade-in ring-1 ring-black/5 p-1">
                                                    {[
                                                        { id: 'sans', label: '기본 고딕', cls: 'font-sans' },
                                                        { id: 'nanum', label: '나눔고딕', cls: 'font-nanum' },
                                                        { id: 'nanum-bold', label: '나눔고딕 Bold', cls: 'font-nanum font-bold' },
                                                        { id: 'serif', label: '나눔명조', cls: 'font-serif' },
                                                        { id: 'jua', label: '주아체', cls: 'font-jua' },
                                                        { id: 'hand', label: '개구체', cls: 'font-hand' },
                                                    ].map(f => (
                                                        <button 
                                                            key={f.id}
                                                            onClick={() => { setReportFont(f.id); setShowReportFontList(false); }}
                                                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between group mb-0.5 last:mb-0 ${f.cls} ${reportFont === f.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            <span>{f.label}</span>
                                                            {reportFont === f.id && <Icon d={PATHS.check} size={12} className="text-indigo-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500">중점 분석 분야 (Focus)</label>
                                        <select value={reportFocus} onChange={e=>setReportFocus(e.target.value)} className="text-xs p-1.5 border border-slate-200 rounded outline-none focus:border-indigo-500"><option value="comprehensive">🏫 학교생활 종합</option><option value="study">📝 학습 태도</option><option value="relationship">🤝 교우 관계</option><option value="habit">⏰ 생활 습관</option></select>
                                    </div>
                                </div>
                                <Btn onClick={generateReportContent} disabled={isGenerating} className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 ${apiKey ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                                    {isGenerating ? '작성 중...' : apiKey ? '✨ AI로 리포트 새로 작성하기' : '🔄 기간 설정 적용하여 다시 쓰기'}
                                </Btn>
                                {!apiKey && <div className="text-[10px] text-slate-400 mt-1 text-center">* 설정에서 API 키를 입력하면 AI가 더 풍성한 내용을 작성해줍니다.</div>}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs font-bold text-slate-500">내용 편집</span>
                                        <div className="relative">
                                            <button onClick={() => setShowPhraseList(!showPhraseList)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 font-bold flex items-center gap-1">
                                                <Icon d={PATHS.list} size={10} /> 상용구
                                            </button>
                                            {showPhraseList && (
                                                <div className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 px-1">
                                                        <span className="text-xs font-bold text-slate-600">저장된 문구</span>
                                                        <button onClick={handleAddPhrase} className="text-[10px] text-indigo-500 hover:underline">현재 내용 저장</button>
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto custom-scroll space-y-1">
                                                        {phrases.length > 0 ? phrases.map((p, i) => (
                                                            <div key={i} className="group flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100" onClick={() => handleApplyPhrase(p)}>
                                                                <span className="text-xs text-slate-600 line-clamp-2 flex-1">{p}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeletePhrase(i); }} className="text-slate-300 hover:text-rose-500"><Icon d={PATHS.trash} size={12} /></button>
                                                            </div>
                                                        )) : <div className="text-center text-slate-400 text-xs py-2">저장된 상용구가 없습니다.</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { let comment = `${student.name} 학생은 현재 레벨 ${level}로, 평균 수행률 ${avgRate}%를 기록하며 성실하게 학교 생활을 하고 있습니다. ${missedTags.length > 0 ? `특히 ${missedTags.map(t=>t[0]).join(', ')} 과목에 조금 더 관심을 기울인다면 더욱 성장할 수 있을 것입니다.` : "모든 과목에서 고르게 우수한 모습을 보이고 있습니다."} 가정에서도 많은 칭찬과 격려 부탁드립니다.`; setTempComment(comment); }} className="text-[10px] text-slate-400 hover:text-rose-500 underline">초기화</button>
                                </div>
                                <textarea className="w-full h-48 p-4 border border-slate-200 rounded-xl text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none custom-scroll" value={tempComment} onChange={(e) => setTempComment(e.target.value)} placeholder="리포트에 들어갈 내용을 작성해주세요." />
                                <div className="flex gap-2 pt-4 mt-2 border-t border-slate-100">
                                    <Btn onClick={handleSaveReportDraft} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 shadow-sm flex items-center justify-center gap-1 text-sm whitespace-nowrap transition-colors"><Icon d={PATHS.check} size={16} /> 초안 저장</Btn>
                                    <Btn onClick={handleCopyText} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 shadow-sm flex items-center justify-center gap-1 text-sm whitespace-nowrap transition-colors"><Icon d={PATHS.copy} size={16} /> 텍스트 복사</Btn>
                                    <Btn onClick={handleDownloadReport} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-1 text-sm whitespace-nowrap transition-colors"><Icon d={PATHS.download} size={16} /> 이미지 저장</Btn>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isCalendarOpen && (
                    <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={grassStart} selectionMode="range" onSelectRange={(s, e) => { setGrassStart(s); setGrassEnd(e); }} records={records} appConfig={appConfig} groupsByDate={{}} mode="record" dailyTasks={dailyTasks} zIndex="z-[2000]" />
                )}
            </div>
        </div>
    );
};

window.StatsGrassModal = StatsGrassModal;
