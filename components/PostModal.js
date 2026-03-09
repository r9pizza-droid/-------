const { useState, useEffect, useRef } = React;

const PostModal = ({ isOpen, onClose, onSave, initialPost, imgbbApiKey, userNickname, showToast }) => {
    const [category, setCategory] = useState('생활지도팁');
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState(initialPost ? initialPost.authorName : (userNickname || ""));
    const [content, setContent] = useState("");
    const [postPassword, setPostPassword] = useState("");
    const [imageUrls, setImageUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [resourceLink, setResourceLink] = useState("");
    const [resourceTitle, setResourceTitle] = useState("");
    const quillRef = useRef(null);
    const draftContentRef = useRef("");

    useEffect(() => {
        if (isOpen) {
            if (initialPost) {
                setCategory(initialPost.category);
                setTitle(initialPost.title);
                setAuthorName(initialPost.authorName);
                setContent(initialPost.content);
                setPostPassword(initialPost.postPassword);
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
                            setPostPassword(p.postPassword || "");
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
                    setPostPassword("");
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
                const draft = { category, title, authorName, content, postPassword, imageUrls, tags, resourceLink, resourceTitle, timestamp: Date.now() };
                localStorage.setItem('cls_post_draft', JSON.stringify(draft));
            }
        }
    }, [category, title, authorName, content, postPassword, imageUrls, tags, resourceLink, resourceTitle, isOpen, initialPost]);

    useEffect(() => {
        if (isOpen) {
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
                            ]
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
    }, [isOpen, initialPost]);

    const compressImage = (file, maxWidth = 800, quality = 0.6) => {
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
                        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                        else reject(new Error("이미지 압축 실패"));
                    }, 'image/jpeg', quality);
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
        const draft = { category, title, authorName, content, postPassword, imageUrls, tags, resourceLink, resourceTitle, timestamp: Date.now() };
        localStorage.setItem('cls_post_draft', JSON.stringify(draft));
        if (showToast) showToast("임시 저장되었습니다.");
        else alert("임시 저장되었습니다.");
    };

    const handleSubmit = () => {
        if (!title.trim() || !authorName.trim() || !content.trim() || !postPassword.trim()) {
            alert("모든 항목을 입력해주세요.");
            return;
        }
        localStorage.setItem('community_authorName', authorName);
        onSave(title, content, authorName, category, postPassword, imageUrls, tags, resourceLink, resourceTitle);
    };

    if (!isOpen) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={initialPost ? "게시글 수정" : "새 꿀팁 쓰기"} icon={PATHS.edit}>
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">카테고리</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['생활지도팁', '수업팁', '업무팁', '기타(잡담)'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`py-3 rounded-xl text-xs font-bold transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">제목</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" placeholder="제목을 입력하세요" />
                </div>
                <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-700 mb-2">
                        작성자: {authorName}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">비밀번호</label>
                    <input type="password" maxLength={4} value={postPassword} onChange={(e) => setPostPassword(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" placeholder="비밀번호 4자리" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">내용</label>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div id="quill-editor" className="text-sm" style={{ border: 'none' }}></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">해시태그</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl bg-white focus-within:border-indigo-500 transition-colors">
                        {tags.map((tag, index) => (
                            <span key={index} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                                #{tag}
                                <button onClick={() => setTags(tags.filter((_, i) => i !== index))} className="hover:text-indigo-800"><Icon d={PATHS.x} size={10}/></button>
                            </span>
                        ))}
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="flex-1 min-w-[100px] text-sm outline-none bg-transparent" placeholder="태그 입력 (엔터)" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">📎 학습 자료(파일/링크) 공유 (선택)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} className="w-full sm:w-1/3 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" placeholder="버튼 이름 (예: 학습지)" />
                        <input value={resourceLink} onChange={(e) => setResourceLink(e.target.value)} className="w-full sm:flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">사진 첨부 (선택)</label>
                    {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {imageUrls.map((url, idx) => (
                                <div key={idx} className="relative aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group/img">
                                    <img src={url} alt={`첨부 ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 hover:bg-rose-500 transition-colors shadow-sm"><Icon d={PATHS.x} size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <label 
                            className={`flex-1 p-3 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (!isUploading) {
                                    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
                                }
                            }}
                        >
                            {isUploading ? <Icon d={PATHS.spinner} className="animate-spin" /> : <Icon d={PATHS.upload} />}
                            <span>{isUploading ? `업로드 중... ${uploadProgress}%` : "이미지 추가 (클릭, 드래그, 붙여넣기)"}</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                    </div>
                    {!imgbbApiKey && <p className="text-[10px] text-rose-500">* 사진을 올리려면 설정에서 ImgBB API 키를 등록해주세요.</p>}
                </div>
                <div className="flex gap-2 pt-2">
                    <Btn onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">취소</Btn>
                    {!initialPost && (
                        <Btn onClick={handleManualSaveDraft} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50">임시 저장</Btn>
                    )}
                    <Btn onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">{initialPost ? "수정" : "등록"}</Btn>
                </div>
            </div>
        </BaseModal>
    );
};
