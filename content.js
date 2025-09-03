// 업로드 창에 AI생성 버튼 추가 및 이벤트 처리
(function () {
  // 여러 이미지, 설명, 태그 입력란을 모두 배열로 반환하는 함수
  function findAllUploadElements() {
    // [한글주석] 업로드 폼 내 설명 및 태그 입력란 모두 탐색 (한글/영문 대응)
    const descs = Array.from(
      document.querySelectorAll(
        'textarea[placeholder*="설명"], textarea[placeholder*="description"], input[placeholder*="설명"], input[placeholder*="description"]'
      )
    );
    const tags = Array.from(
      document.querySelectorAll('input[placeholder="태그 추가"]')
    );
    return { descs, tags };
  }

  // [한글주석] AI생성 버튼을 모달 하단 버튼 그룹(취소/제출 옆)에만 추가
  function insertAIGenerateButton() {
    // 버튼 그룹(div.MW6IL) 탐색
    const btnGroup = document.querySelector("div.MW6IL");
    if (!btnGroup) return;
    // 이미 버튼 있으면 중복 삽입 방지
    if (btnGroup.querySelector("#ai-generate-btn")) return;
    // 버튼 생성
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "ai-generate-btn";
    btn.innerText = "AI생성";
    btn.style.margin = "0 8px 0 0";
    btn.style.background = "#10a37f";
    btn.style.color = "#fff";
    btn.style.border = "1px solid #222";
    btn.style.borderRadius = "4px";
    btn.style.padding = "0 11px";
    btn.style.height = "32px";
    btn.style.fontSize = "14px";
    btn.style.boxSizing = "border-box";
    btn.style.cursor = "pointer";
    // 취소 버튼 앞에 삽입
    if (btnGroup.firstElementChild) {
      btnGroup.insertBefore(btn, btnGroup.firstElementChild);
    } else {
      btnGroup.appendChild(btn);
    }
    // [한글주석] 버튼 클릭 시 업로드 중인 모든 이미지를 순차적으로 AI생성 처리
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.innerText = "AI생성중...";
      // 버튼 복원은 실제 입력 후 onMessage에서 처리
      try {
        // [한글주석] 업로드 영역 내 모든 img 요소 선택
        const uploadAreaDiv = document.evaluate(
          "/html/body/div/dialog/div[1]/div/div[2]/div[3]/div/form/div[1]/div/div",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (!uploadAreaDiv) {
          alert("업로드 영역을 찾을 수 없습니다.");
          btn.disabled = false;
          btn.innerText = "AI생성";
          return;
        }
        const imgList = uploadAreaDiv.querySelectorAll("img");
        if (imgList.length === 0) {
          alert("업로드된 이미지가 없습니다.");
          btn.disabled = false;
          btn.innerText = "AI생성";
          return;
        }
        // [한글주석] 처리할 이미지 개수 저장
        window.__ai_gen_remain = imgList.length;
        for (let i = 0; i < imgList.length; i++) {
          const imgElem = imgList[i];
          if (imgElem.src.startsWith("blob:") || imgElem.src.startsWith("data:")) {
            try {
              const blob = await (await fetch(imgElem.src)).blob();
              const arrayBuffer = await blob.arrayBuffer();
              const base64data = arrayBufferToBase64(arrayBuffer);
              chrome.runtime.sendMessage({
                type: "AI_GENERATE",
                base64Image: base64data,
                idx: i,
              });
            } catch (e) {
              alert("이미지 일괄 처리 중 오류 발생: " + e.message);
              // 실패 시에도 카운트 감소
              if (typeof window.__ai_gen_remain === "number") {
                window.__ai_gen_remain--;
                if (window.__ai_gen_remain <= 0) {
                  btn.disabled = false;
                  btn.innerText = "AI생성";
                }
              }
            }
          } else {
            chrome.runtime.sendMessage({ type: "AI_GENERATE", imgUrl: imgElem.src, idx: i });
          }
        }
      } catch (e) {
        btn.disabled = false;
        btn.innerText = "AI생성";
      }
    });
  }

  // [한글주석] ArrayBuffer를 base64 문자열로 변환
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // [한글주석] Unsplash 태그 입력란에 태그를 비동기 순차 이벤트로 입력하는 함수
  // [한글주석] Unsplash 태그 입력란에 value 세팅 + input + keydown(쉼표/엔터)로 태그 추가
  // [한글주석] Unsplash 태그 입력란에 value 세팅 + input + keydown(쉼표/엔터)로 태그 추가
  async function addTagsToUnsplashInput(input, tagStr) {
    if (!input) return;
    input.focus();
    input.value = tagStr;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const tagArr = tagStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (let i = 0; i < tagArr.length; i++) {
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: ",",
          code: "Comma",
          which: 188,
          keyCode: 188,
        })
      );
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          which: 13,
          keyCode: 13,
        })
      );
    }
  }

  // AI 응답 수신 및 해당 입력란 자동 입력
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    // [한글주석] background.js에서 전달하는 로그 메시지 처리
    if (msg.type === "AI_LOG" && msg.log) {
      console.log("[백그라운드→콘텐츠]", msg.log);
      return;
    }
    if (msg.type === "AI_RESULT") {
      const { idx, description, tags: tagStr, error, apiRaw, provider } = msg;
      if (error) {
        alert(`[AI생성] 오류: ${error}`);
        // 오류 발생 시에도 카운트 감소
        if (typeof window.__ai_gen_remain === "number") {
          window.__ai_gen_remain--;
          if (window.__ai_gen_remain <= 0) {
            const btn = document.getElementById("ai-generate-btn");
            if (btn) {
              btn.disabled = false;
              btn.innerText = "AI생성";
            }
          }
        }
        return;
      }
      const { descs, tags } = findAllUploadElements();
      if (descs[idx]) {
        // [한글주석] AI 제공업체 정보를 포함한 설명 설정
        const providerInfo = provider === 'gemini' ? ' (Gemini AI)' : ' (OpenAI)';
        console.log(`[AI생성] ${providerInfo} 설명 생성 완료:`, description);
        
        descs[idx].value = description;
        descs[idx].dispatchEvent(new Event("input", { bubbles: true }));
      }
      let finalTags = tagStr;
      if ((!tagStr || tagStr.trim() === "") && description) {
        const match = description.match(/\[([^\]]+)\]/);
        if (match && match[1]) {
          finalTags = match[1]
            .split(",")
            .map((s) => s.trim())
            .join(", ");
        }
      }
      if (finalTags && typeof finalTags === "string" && tags[idx]) {
        await addTagsToUnsplashInput(tags[idx], finalTags);
      }
      // 성공/실패 무관하게 카운트 감소 후 버튼 복원
      if (typeof window.__ai_gen_remain === "number") {
        window.__ai_gen_remain--;
        if (window.__ai_gen_remain <= 0) {
          const btn = document.getElementById("ai-generate-btn");
          if (btn) {
            btn.disabled = false;
            btn.innerText = "AI생성";
          }
        }
      }
    }
  });

  // [한글주석] 업로드 폼 등장 감지 및 AI생성 버튼 자동 삽입 (MutationObserver 사용)
  const observer = new MutationObserver(() => {
    insertAIGenerateButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 페이지 최초 로드시도 버튼 삽입 시도 + 이미지 업로드 자동 감지 시작
  window.addEventListener("DOMContentLoaded", () => {
    insertAIGenerateButton();
    observeImageUpload();
  });

  // [한글주석] 업로드 창 내 이미지 미리보기 DOM 변화 감지 및 자동 AI 요청
  function observeImageUpload() {
    // 업로드 영역(div.MW6IL의 부모) 또는 body 전체 감시
    const uploadArea =
      document.querySelector("div.MW6IL")?.parentElement || document.body;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(async (node) => {
          if (node.nodeType === 1 && node.tagName === "IMG") {
            const imgElem = node;
            // [한글주석] 새로 추가된 이미지가 blob 또는 data:로컬 파일이면 자동 요청
            if (
              imgElem.src.startsWith("blob:") ||
              imgElem.src.startsWith("data:")
            ) {
              try {
                const blob = await (await fetch(imgElem.src)).blob();
                const arrayBuffer = await blob.arrayBuffer();
                function arrayBufferToBase64(buffer) {
                  let binary = "";
                  const bytes = new Uint8Array(buffer);
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  return window.btoa(binary);
                }
                const base64data = arrayBufferToBase64(arrayBuffer);
                chrome.runtime.sendMessage({
                  type: "AI_GENERATE",
                  base64Image: base64data,
                  idx: 0,
                });
                // [한글주석] 자동 요청 후 필요시 안내 메시지
                console.log("[AI생성] 새 이미지 자동 감지 및 AI 요청 전송");
              } catch (e) {
                console.error("[AI생성] 자동 업로드 이미지 처리 실패:", e);
              }
            }
          }
        });
      });
    });
    observer.observe(uploadArea, { childList: true, subtree: true });
  }
})();

// [한글주석] AI생성 버튼은 항상 모달 하단(취소 옆)에 위치하며, 클릭 시 업로드 중인 모든 이미지에 대해 순차적으로 AI 설명/태그를 자동 입력합니다.
