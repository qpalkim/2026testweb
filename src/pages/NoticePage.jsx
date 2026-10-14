import { useEffect, useRef, useState } from "react";
import { PageFrame, PageHeading } from "../components/site/InteriorLayout.jsx";
import { getUserRole } from "../lib/userRole.js";
import { supabase } from "../lib/supabase.js";

const BUCKET = "notice-images";
const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const emptyNotice = { title: "", content: "", is_pinned: false };

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function imageUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function sortNotices(items) {
  return [...items].sort(
    (a, b) =>
      Number(b.is_pinned) - Number(a.is_pinned) ||
      new Date(b.created_at) - new Date(a.created_at),
  );
}

function FilePreview({ file, onRemove, index }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const frame = requestAnimationFrame(() => setUrl(objectUrl));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div className="notice-image-preview">
      {url && <img src={url} alt={`첨부 이미지 ${index + 1} 미리보기`} />}
      <button type="button" onClick={onRemove} aria-label={`첨부 이미지 ${index + 1} 제거`}>
        제거
      </button>
    </div>
  );
}

export function NoticePage() {
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState(emptyNotice);
  const [retainedImages, setRetainedImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const isAdmin = getUserRole(user) === "admin";

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      if (!supabase) {
        setError("공지사항을 불러올 수 없습니다. Supabase 설정을 확인해 주세요.");
        setLoadFailed(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: authData } = await supabase.auth.getUser();
        let currentUser = authData.user;
        if (getUserRole(currentUser) === "admin") {
          const { data: refreshed, error: refreshError } =
            await supabase.auth.refreshSession();
          if (!refreshError && refreshed.user) currentUser = refreshed.user;
        }

        const { data, error: queryError } = await supabase
          .from("notices")
          .select("id, title, content, is_pinned, created_at, image_paths")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        if (!isMounted) return;
        setUser(currentUser ?? null);
        setNotices(data ?? []);
      } catch {
        if (isMounted) {
          setLoadFailed(true);
          setError("공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadNotices();
    return () => {
      isMounted = false;
    };
  }, []);

  function resetImageSelection(paths = []) {
    setRetainedImages(paths);
    setNewFiles([]);
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyNotice);
    resetImageSelection();
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(notice) {
    setEditingId(notice.id);
    setForm({ title: notice.title, content: notice.content, is_pinned: notice.is_pinned });
    resetImageSelection(notice.image_paths ?? []);
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyNotice);
    resetImageSelection();
    setIsDragging(false);
  }

  function addFiles(fileList) {
    const candidates = Array.from(fileList);
    const validFiles = [];
    let validationMessage = "";

    for (const file of candidates) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        validationMessage = "JPG, PNG, WEBP 이미지 파일만 첨부할 수 있습니다.";
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        validationMessage = "이미지는 파일당 5MB 이하로 첨부해 주세요.";
        continue;
      }
      validFiles.push(file);
    }

    const availableSlots = MAX_IMAGES - retainedImages.length - newFiles.length;
    if (validFiles.length > availableSlots) {
      validationMessage = "공지사항 이미지는 최대 3개까지 첨부할 수 있습니다.";
    }
    setNewFiles((current) => [...current, ...validFiles.slice(0, Math.max(0, availableSlots))]);
    setError(validationMessage);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();

    setError("");
    setMessage("");

    if (!isAdmin) {
      setError("관리자만 공지사항을 작성할 수 있습니다.");
      return;
    }
    if (!title || title.length > 160 || !content || content.length > 12000) {
      setError("제목과 내용을 확인해 주세요. 제목은 160자, 내용은 12,000자까지 입력할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    const uploadedPaths = [];
    try {
      for (const file of newFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `notices/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const imagePaths = [...retainedImages, ...uploadedPaths];
      const values = { title, content, is_pinned: form.is_pinned, image_paths: imagePaths };
      const query = editingId
        ? supabase.from("notices").update(values).eq("id", editingId)
        : supabase.from("notices").insert(values);
      const { data, error: saveError } = await query
        .select("id, title, content, is_pinned, created_at, image_paths")
        .single();

      if (saveError) throw saveError;

      setNotices((current) =>
        sortNotices(
          editingId
            ? current.map((notice) => (notice.id === data.id ? data : notice))
            : [data, ...current],
        ),
      );
      setExpandedId(data.id);
      closeForm();

      const removedPaths = (notices.find((notice) => notice.id === editingId)?.image_paths ?? [])
        .filter((path) => !imagePaths.includes(path));
      let cleanupFailed = false;
      if (removedPaths.length) {
        try {
          const { error: cleanupError } = await supabase.storage.from(BUCKET).remove(removedPaths);
          cleanupFailed = Boolean(cleanupError);
        } catch {
          cleanupFailed = true;
        }
      }
      setMessage(cleanupFailed
        ? "공지사항은 저장했지만 제거한 이미지 일부를 정리하지 못했습니다."
        : editingId ? "공지사항을 수정했습니다." : "공지사항을 등록했습니다.");
    } catch {
      if (uploadedPaths.length) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths);
      }
      setError("저장하지 못했습니다. 관리자 권한과 첨부 이미지 설정을 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(notice) {
    if (!isAdmin || !window.confirm("이 공지사항을 삭제하시겠습니까?")) return;

    setError("");
    setMessage("");
    try {
      const { error: deleteError } = await supabase
        .from("notices")
        .delete()
        .eq("id", notice.id);
      if (deleteError) throw deleteError;

      setNotices((current) => current.filter((item) => item.id !== notice.id));
      if (expandedId === notice.id) setExpandedId(null);
      if (notice.image_paths?.length) {
        let cleanupFailed = false;
        try {
          const { error: cleanupError } = await supabase.storage.from(BUCKET).remove(notice.image_paths);
          cleanupFailed = Boolean(cleanupError);
        } catch {
          cleanupFailed = true;
        }
        setMessage(cleanupFailed
          ? "공지사항은 삭제했지만 첨부 이미지 일부를 정리하지 못했습니다."
          : "공지사항을 삭제했습니다.");
      } else {
        setMessage("공지사항을 삭제했습니다.");
      }
    } catch {
      setError("삭제하지 못했습니다. 관리자 권한을 확인해 주세요.");
    }
  }

  return (
    <PageFrame active="notices">
      <PageHeading
        eyebrow="LOCALIT NOTICE BOARD"
        number="05"
        total="05"
        title={<>로컬릿의 소식,<br /><em>공지사항</em></>}
        lead="서비스의 새로운 소식과 꼭 확인해야 할 안내를 전해드립니다."
      />
      <main className="interior-container interior-content notice-content">
        <div className="notice-board-heading">
          <div>
            <p className="interior-eyebrow">LATEST UPDATES</p>
            <h2>전체 공지</h2>
            <p>총 {notices.length}개의 소식</p>
          </div>
          {isAdmin && <button className="interior-button" type="button" onClick={openCreateForm}>공지 작성</button>}
        </div>

        {error && <p className="notice-feedback is-error" role="alert">{error}</p>}
        {message && <p className="notice-feedback" role="status">{message}</p>}

        {isFormOpen && isAdmin && (
          <form className="notice-editor" onSubmit={handleSubmit}>
            <div className="notice-editor-heading">
              <div>
                <p className="interior-eyebrow">ADMINISTRATOR</p>
                <h2>{editingId ? "공지 수정" : "새 공지 작성"}</h2>
              </div>
              <button className="notice-close-button" type="button" onClick={closeForm}>닫기</button>
            </div>
            <label>
              제목
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={160} required />
            </label>
            <label>
              내용
              <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} maxLength={12000} rows={8} required />
            </label>
            <section className="notice-image-field" aria-labelledby="notice-image-label">
              <div className="notice-image-field-heading">
                <strong id="notice-image-label">이미지 첨부</strong>
                <span>{retainedImages.length + newFiles.length}/{MAX_IMAGES} · 파일당 최대 5MB</span>
              </div>
              <div
                className={`notice-dropzone${isDragging ? " is-dragging" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
              >
                <span>이미지를 이곳에 끌어 놓으세요</span>
                <span className="notice-dropzone-or">또는</span>
                <button type="button" className="notice-close-button" onClick={() => fileInputRef.current?.click()}>
                  파일 선택
                </button>
                <input
                  ref={fileInputRef}
                  className="notice-file-input"
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  multiple
                  aria-label="공지사항 이미지 파일 선택"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <small>JPG, PNG, WEBP 형식 · 최대 3개</small>
              </div>
              {(retainedImages.length > 0 || newFiles.length > 0) && (
                <div className="notice-image-previews">
                  {retainedImages.map((path, index) => (
                    <div className="notice-image-preview" key={path}>
                      <img src={imageUrl(path)} alt={`첨부 이미지 ${index + 1} 미리보기`} />
                      <button type="button" onClick={() => setRetainedImages((current) => current.filter((item) => item !== path))} aria-label={`첨부 이미지 ${index + 1} 제거`}>제거</button>
                    </div>
                  ))}
                  {newFiles.map((file, index) => (
                    <FilePreview
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      index={retainedImages.length + index}
                      onRemove={() => setNewFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    />
                  ))}
                </div>
              )}
            </section>
            <label className="notice-pin-control">
              <input type="checkbox" checked={form.is_pinned} onChange={(event) => setForm({ ...form, is_pinned: event.target.checked })} />
              상단에 고정
            </label>
            <div className="notice-editor-actions">
              <button className="notice-close-button" type="button" onClick={closeForm}>취소</button>
              <button className="interior-button" type="submit" disabled={isSaving}>
                {isSaving ? "저장 중" : editingId ? "수정 저장" : "공지 등록"}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="notice-empty" role="status">공지사항을 불러오는 중입니다.</p>
        ) : loadFailed ? null : notices.length === 0 ? (
          <div className="notice-empty"><span aria-hidden="true">L</span><h3>등록된 공지사항이 없습니다.</h3><p>새로운 소식이 생기면 이곳에 안내해 드리겠습니다.</p></div>
        ) : (
          <ol className="notice-list">
            {notices.map((notice, index) => {
              const isExpanded = expandedId === notice.id;
              const thumbnail = notice.image_paths?.[0];
              return (
                <li key={notice.id} className={isExpanded ? "is-expanded" : ""}>
                  <article>
                    <button className="notice-summary" type="button" aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : notice.id)}>
                      <span className="notice-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="notice-title-wrap">
                        {notice.is_pinned && <span className="notice-pinned">중요</span>}
                        {thumbnail && <img className="notice-thumbnail" src={imageUrl(thumbnail)} alt="" loading="lazy" />}
                        <strong>{notice.title}</strong>
                      </span>
                      <time dateTime={notice.created_at}>{formatDate(notice.created_at)}</time>
                      <span className="notice-toggle" aria-hidden="true" />
                    </button>
                    {isExpanded && (
                      <div className="notice-detail">
                        <p>{notice.content}</p>
                        {notice.image_paths?.length > 0 && (
                          <div className="notice-detail-images">
                            {notice.image_paths.map((path, imageIndex) => (
                              <img key={path} src={imageUrl(path)} alt={`${notice.title} 첨부 이미지 ${imageIndex + 1}`} loading="lazy" />
                            ))}
                          </div>
                        )}
                        {isAdmin && <div className="notice-admin-actions"><button type="button" onClick={() => openEditForm(notice)}>수정</button><button type="button" onClick={() => handleDelete(notice)}>삭제</button></div>}
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </PageFrame>
  );
}
