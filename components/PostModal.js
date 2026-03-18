const { useState, useEffect, useRef } = React;

const PostModal = ({ isOpen, onClose, onSave, initialPost, imgbbApiKey, userNickname, showToast }) => {
    const [category, setCategory] = useState('생활지도팁');
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState(initialPost ? initialPost.authorName : (userNickname || ""));
    const [content, setContent] = useState("");
    const [imageUrls, setImageUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [resourceLink, setResourceLink] = useState("");
    const [resourceTitle, setResourceTitle] = useState("");
    const [canUseQuill, setCanUseQuill] = useState(false);
    const quillRef = useRef(null);
    const draftContentRef = useRef("");

    useEffect(() => {
        if (isOpen) {
            if (!window.Quill) {
                let script = document.getElementById('quill-js');
                if (!script) {
                    script = document.createElement('script');
                    script.id = 'quill-js';
                    script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
                    document.head.appendChild(script);
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
                    document.head.appendChild(link);
                }
                script.addEventListener('load', () => setCanUseQuill(true));
            } else { setCanUseQuill(true); }

            if (initialPost) {
                setCategory(initialPost.category);
                setTitle(initialPost.title);
                setAuthorName(initialPost.authorName);
                setContent(initialPost.content);
                setImageUrls(initialPost.imageUrls || (initialPost.imageUrl ? [initialPost.imageUrl] : []));
                setTags(initialPost.tags || []);
                setResourceLink(initialPost.resourceLink || "");
                setResourceTitle(initialPost.resourceTitle || "");
            } else {
                // [New] 임시 저장 불러오기 로직
                const savedDraft = localStorage.getItem('cls_post_draft');
                let loaded = false;
                if (savedDraft) {
                    if (confirm("작성 중이던 임시 저장 글이 있습니다. 불러오시겠습니까?")) {
                        try {
                            const p = JSON.parse(savedDraft);
                            setCategory(p.category || '생활지도팁');
                            setTitle(p.title || "");
                            setAuthorName(p.authorName || userNickname || "");
                            setContent(p.content || "");
                            setImageUrls(p.imageUrls || []);
                            setTags(p.tags || []);
                            setResourceLink(p.resourceLink || "");
                            setResourceTitle(p.resourceTitle || "");
                            draftContentRef.current = p.content || "";
                            loaded = true;
                        } catch(e) { console.error(e); }
                    } else {
                        localStorage.removeItem('cls_post_draft');
                    }
                }
                
                if (!loaded) {
                    setCategory('생활지도팁');
                    setTitle("");
                    setAuthorName(userNickname || "");
                    setContent("");
                    setImageUrls([]);
                    setTags([]);
                    setResourceLink("");
                    setResourceTitle("");
                    draftContentRef.current = "";
                }
            }
        }
    }, [isOpen, initialPost, userNickname]);

    // [New] 임시 저장 자동 저장 로직
    useEffect(() => {
        if (isOpen && !initialPost) {
            if (title.trim() || content.trim() || tags.length > 0 || imageUrls.length > 0 || resourceLink.trim()) {
                const finalAuthorName = userNickname || authorName;
                const draft = { category, title, authorName: finalAuthorName, content, imageUrls, tags, resourceLink, resourceTitle, timestamp: Date.now() };
                localStorage.setItem('cls_post_draft', JSON.stringify(draft));
            }
        }
    }, [category, title, authorName, userNickname, content, imageUrls, tags, resourceLink, resourceTitle, isOpen, initialPost]);

    useEffect(() => {
        if (isOpen && canUseQuill) {
            const timer = setTimeout(() => {
                const container = document.getElementById('quill-editor');
                if (container && !quillRef.current && window.Quill) {
                    quillRef.current = new window.Quill(container, {
                        theme: 'snow',
                        placeholder: '내용을 입력하세요...',
                        modules: {
                            toolbar: [
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                [{ 'color': [] }, { 'background': [] }],
                                ['link', 'image', 'clean']
                            ],
                            keyboard: {
                                bindings: {
                                    enter: {
                                        key: 13,
                                        shiftKey: false,
                                        handler: function() {
                                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
                                            if (!isMobile) {
                                                document.getElementById('post-submit-btn')?.click();
                                                return false;
                                            }
                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                    });

                    // [New] 이미지 업로드 핸들러 추가
                    quillRef.current.getModule('toolbar').addHandler('image', () => {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'image/*');
                        input.click();

                        input.onchange = async () => {
                            const file = input.files[0];
                            if (!file) return;

                            if (!imgbbApiKey) {
                                alert("이미지 업로드를 위해서는 설정 > 데이터 관리 > 외부 서비스 연동에서 ImgBB API 키를 설정해야 합니다.");
                                return;
                            }

                            try {
                                setIsUploading(true);
                                let uploadFile = file;
                                // 2MB 이상일 경우 자동 압축 (compressImage 함수 재사용)
                                if (file.size > 2 * 1024 * 1024) {
                                    uploadFile = await compressImage(file);
                                }

                                const formData = new FormData();
                                formData.append("image", uploadFile);

                                const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                                    method: "POST",
                                    body: formData
                                });
                                const data = await res.json();

                                if (data.success) {
                                    const range = quillRef.current.getSelection(true);
                                    quillRef.current.insertEmbed(range.index, 'image', data.data.url);
                                    quillRef.current.setSelection(range.index + 1);
                                } else {
                                    alert("이미지 업로드 실패: " + (data.error?.message || "알 수 없는 오류"));
                                }
                            } catch (e) {
                                console.error(e);
                                alert("이미지 업로드 중 오류가 발생했습니다.");
                            } finally {
                                setIsUploading(false);
                            }
                        };
                    });

                    const initialContent = initialPost ? initialPost.content : draftContentRef.current;
                    const isHtml = /<[a-z][\s\S]*>/i.test(initialContent);
                    if (isHtml) quillRef.current.clipboard.dangerouslyPasteHTML(initialContent);
                    else quillRef.current.setText(initialContent);
                    quillRef.current.on('text-change', () => { setContent(quillRef.current.root.innerHTML); });
                }
            }, 100);
            return () => clearTimeout(timer);
        } else { quillRef.current = null; }
    }, [isOpen, initialPost, canUseQuill]);

    const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        // [Update] WebP 포맷 변환으로 용량 최적화
                        if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp', lastModified: Date.now() }));
                        else reject(new Error("이미지 압축 실패"));
                    }, 'image/webp', quality);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const uploadFiles = async (files) => {
        if (!files || files.length === 0) return;
        
        if (!imgbbApiKey) {
            alert("이미지 업로드를 위해서는 설정 > 데이터 관리 > 외부 서비스 연동에서 ImgBB API 키를 설정해야 합니다.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        try {
            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                let uploadFile = files[i];
                // 2MB 이상일 경우 자동 압축
                if (uploadFile.size > 2 * 1024 * 1024) {
                    uploadFile = await compressImage(uploadFile);
                }

                const formData = new FormData();
                formData.append("image", uploadFile);
                
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                
                if (data.success) {
                    setImageUrls(prev => [...prev, data.data.url]);
                    successCount++;
                }
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
            
            if (successCount < files.length) alert(`일부 이미지 업로드 실패 (${successCount}/${files.length} 성공)`);
            setIsUploading(false);
        } catch (err) {
            console.error(err);
            alert("이미지 업로드 중 오류가 발생했습니다.");
            setIsUploading(false);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        uploadFiles(files);
        e.target.value = '';
    };

    useEffect(() => {
        const handlePaste = (e) => {
            if (!isOpen) return;
            const items = e.clipboardData.items;
            const files = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    files.push(items[i].getAsFile());
                }
            }
            if (files.length > 0) uploadFiles(files);
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, imgbbApiKey]);

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setTagInput("");
            }
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const handleManualSaveDraft = () => {
        const finalAuthorName = userNickname || authorName;
        const draft = { category, title, authorName: finalAuthorName, content, imageUrls, tags, resourceLink, resourceTitle, timestamp: Date.now() };
        localStorage.setItem('cls_post_draft', JSON.stringify(draft));
        if (showToast) showToast("임시 저장되었습니다.");
        else alert("임시 저장되었습니다.");
    };

    const handleSubmit = () => {
        const finalAuthorName = userNickname || authorName;
        if (!title.trim() || !finalAuthorName.trim() || !content.trim()) {
            alert("모든 항목을 입력해주세요.");
            return;
        }
        localStorage.setItem('community_authorName', finalAuthorName);
        onSave(title, content, finalAuthorName, category, "", imageUrls, tags, resourceLink, resourceTitle);
    };

    const modalFooter = (
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-full">
            <button onClick={onClose} className="flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap">취소</button>
            {!initialPost && (
                <Btn onClick={handleManualSaveDraft} className="flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap">임시 저장</Btn>
            )}
                <Btn id="post-submit-btn" onClick={handleSubmit} className="flex-1 sm:flex-none px-3 sm:px-8 py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] whitespace-nowrap">{initialPost ? "수정 완료" : "게시글 등록"}</Btn>
        </div>
    );

    if (!isOpen) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={initialPost ? "게시글 수정" : "새 꿀팁 쓰기"} icon={PATHS.edit} footer={modalFooter}>
            <div className="space-y-6">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">카테고리</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['생활지도팁', '수업팁', '업무팁', '기타(잡담)'].map((cat, idx) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all animate-fade-in ${category === cat ? 'bg-indigo-600 text-white shadow-md transform scale-[1.02] ring-2 ring-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">제목</label>
                    <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('post-submit-btn')?.click(); }
                        }}
                        className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-slate-50 hover:bg-white focus:bg-white" 
                        placeholder="제목을 입력하세요" 
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">작성자</label>
                    <input value={userNickname || authorName} readOnly className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none bg-slate-100 text-slate-500 font-bold cursor-not-allowed" placeholder="작성자 이름" />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">내용</label>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {canUseQuill ? (
                            <div id="quill-editor" className="text-sm" style={{ border: 'none', height: '400px' }}></div>
                        ) : (
                            <textarea 
                                className="w-full h-96 p-4 text-sm outline-none resize-none bg-slate-50 focus:bg-white transition-colors" 
                                placeholder="내용을 입력하세요..." 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => {
                                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
                                    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        document.getElementById('post-submit-btn')?.click();
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">해시태그</label>
                    <div className="flex flex-wrap gap-2 p-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300">
                        {tags.map((tag, index) => (
                            <span key={index} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
                                #{tag}
                                <button onClick={() => setTags(tags.filter((_, i) => i !== index))} className="hover:text-indigo-900 bg-indigo-200/50 rounded-full p-0.5"><Icon d={PATHS.x} size={10}/></button>
                            </span>
                        ))}
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="flex-1 min-w-[100px] text-sm outline-none bg-transparent" placeholder="태그 입력 (엔터)" />
                    </div>
                </div>
    
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Icon d={PATHS.link} size={16} className="text-slate-400"/> 학습 자료(파일/링크) 공유</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            value={resourceTitle} 
                            onChange={(e) => setResourceTitle(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('post-submit-btn')?.click(); } }}
                            className="w-full sm:w-1/3 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-slate-50 hover:bg-white focus:bg-white" 
                            placeholder="버튼 이름 (예: 학습지)" 
                        />
                        <input 
                            value={resourceLink} 
                            onChange={(e) => setResourceLink(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('post-submit-btn')?.click(); } }}
                            className="w-full sm:flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-slate-50 hover:bg-white focus:bg-white" 
                            placeholder="https://..." 
                        />
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Icon d={PATHS.image} size={16} className="text-slate-400"/> 사진 첨부</label>
                    {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {imageUrls.map((url, idx) => (
                                <div key={idx} className="relative aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group/img animate-fade-in shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                    <img src={url} alt={`첨부 ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300"></div>
                                    <button onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover/img:opacity-100 hover:bg-rose-500 transition-all duration-300 shadow-sm transform scale-90 group-hover/img:scale-100" title="사진 삭제"><Icon d={PATHS.x} size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <label 
                            className={`flex-1 py-8 border-2 border-dashed rounded-2xl text-sm font-bold flex flex-col items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden ${isUploading ? 'bg-indigo-50 border-indigo-300 text-indigo-600 cursor-wait' : 'bg-slate-50/50 border-slate-300 text-slate-500 hover:bg-indigo-50/50 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (!isUploading) {
                                    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
                                }
                            }}
                        >
                            {isUploading && (
                                <div className="absolute left-0 bottom-0 h-1.5 bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                            )}
                            <div className={`p-3 rounded-full transition-colors duration-300 ${isUploading ? 'bg-indigo-100' : 'bg-white shadow-sm'}`}>
                                {isUploading ? <Icon d={PATHS.spinner} size={24} className="animate-spin text-indigo-600" /> : <Icon d={PATHS.image} size={24} className="text-slate-400 group-hover:text-indigo-500" />}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm">{isUploading ? `안전하게 업로드 중입니다... ${uploadProgress}%` : "여기를 클릭하거나 사진을 드래그하세요"}</span>
                                {!isUploading && <span className="text-[10px] text-slate-400 font-medium mt-1">최대 2MB (자동 압축 지원)</span>}
                            </div>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                    </div>
                    {!imgbbApiKey && <p className="text-[10px] text-rose-500">* 사진을 올리려면 설정에서 ImgBB API 키를 등록해주세요.</p>}
                </div>
            </div>
        </BaseModal>
    );
};

window.PostModal = PostModal;
