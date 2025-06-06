// 백그라운드: OpenAI API 호출 및 설정 관리
// 한글 주석만 사용

// OpenAI API 호출 함수 (공식 문서 표준 준수)
async function callOpenAI(imgUrl, apiKey, model) {
  // 프롬프트 예시
  const prompt = `나는 앞으로 이미지를 올릴꺼야 그 이유는 내가 unsplash 사진작가인데 이미지에 대한 설명과 태그를 얻기 위함이지. 너는 내가 이미지를 주면, 분석해서 사람들이 쉽게 이미지를 찾을 수 있도록 영어로 자세한 설명을 150글자 정도로 알려주고, 관련 태그 15가지를 알려줘야 해. 내가 쉽게 데이터를 복사하여 사용할 수 있도록 별다른 제목 없이 설명을 적고, 다음 줄에 태그들을 콤마로 구분해서 나열해줘`;
  // 메시지 구성
  const messages = [
    { role: "user", content: prompt },
    { role: "user", content: { type: "image_url", image_url: imgUrl } },
  ];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4-vision-preview",
        messages,
        max_tokens: 1000,
        temperature: 0.2, // 창의성 조절 (0.0 ~ 2.0)
        top_p: 1.0,
      }),
    });

    // 상태코드가 200이 아니면 에러 처리
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI생성] OpenAI API 오류:", response.status, errorText);
      return { description: `OpenAI API 오류: ${response.status}`, tags: "" };
    }

    const data = await response.json();
    // 응답에서 설명/태그 추출
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const text = data.choices[0].message.content.trim();
      const [description, tags] = text.split("\n");
      return { description, tags };
    } else {
      console.error("[AI생성] OpenAI 응답 파싱 실패", data);
      return { description: "OpenAI 응답 파싱 실패", tags: "" };
    }
  } catch (err) {
    console.error("[AI생성] 네트워크 또는 기타 오류", err);
    return { description: "네트워크 또는 기타 오류", tags: "" };
  }
}

// base64 이미지로 OpenAI API 호출 함수
async function callOpenAIBase64(base64Image, apiKey, model) {
  // [한글주석] content.js로 로그 전송 함수
  function sendAILog(msg) {
    chrome.tabs &&
      chrome.tabs.query &&
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "AI_LOG", log: msg });
        }
      });
  }
  // OpenAI vision API 등에서 요구하는 형식에 맞게 base64 이미지를 포함
  // 실제 API 스펙에 따라 content 부분을 조정해야 함
  // [한글주석] Vision API 포맷: content 배열에 텍스트+이미지 모두 포함
  // [한글주석] 프롬프트: 영어+json만 반환하도록 명시
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `You are an expert image analyzer for a professional photographer. 
    Please analyze the provided image and provide:
    1. A detailed description in English (about 150 characters) that would help people find this image.
    2. A list of 15 relevant tags separated by commas.
    
    Format your response as follows:
    [description]
    [tag1, tag2, tag3, ...]`,
        },
        // [한글주석] Vision API 최신 포맷: image_url은 반드시 객체 { url: ... }
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64Image}` },
        },
      ],
    },
  ];
  const body = {
    model: model,
    messages: messages,
    max_tokens: 1000,
    temperature: 0.2, // 창의성 조절 (0.0 ~ 2.0)
    top_p: 1.0,
  };
  console.log("[AI생성] OpenAI 요청:", body);
  sendAILog("[AI생성] OpenAI 요청: " + JSON.stringify(body));
  let data = null;
  sendAILog("[AI생성] fetch 요청 시작");
  console.log("[AI생성] fetch 요청 시작"); // [한글주석] fetch 요청 시작 로그
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    // [한글주석] fetch 완료 상태 확인
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        "OpenAI 응답 오류: " + response.status + ", " + errorText
      );
    }
    const data = await response.json();

    let description = "", tags = "";
    try {
      const content = data.choices[0].message.content;
      const lines = content.trim().split(/\r?\n+/);
      description = lines[0] ? lines[0].replace(/^[\[\]]/g, "").trim() : "";
      tags = lines[1] ? lines[1].replace(/^[\[\]]/g, "").trim() : "";
    } catch (e) {
      description = "AI 설명 파싱 실패";
      tags = "";
    }
    return { description, tags };
  } catch (e) {
    return { description: "AI 설명 파싱 실패", tags: "태그실패" };
  }
}

// 메시지 핸들러
// [한글주석] fetch에 50초 타임아웃 적용 유틸리티
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 50000 } = options; // 50초
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("fetch timeout")), timeout)
    ),
  ]);
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  // [한글주석] content.js에서 이미지 ArrayBuffer를 전달받아 Blob으로 복원 후 API로 전송
  if (msg.type === "IMAGE_ARRAYBUFFER" && msg.buffer && msg.mimeType) {
    try {
      const uint8Arr = new Uint8Array(msg.buffer);
      const blob = new Blob([uint8Arr], { type: msg.mimeType });
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");
      // [한글주석] 실제 API URL로 변경 필요
      const apiUrl = "API_URL";
      const res = await fetchWithTimeout(apiUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("[AI생성] 이미지 API 응답:", data); // [한글주석] 결과 확인
      // 필요시 content.js로 결과 메시지 전송
    } catch (e) {
      console.error("[AI생성] 이미지 API 전송 실패:", e);
    }
    return;
  }
  if (msg.type === "AI_GENERATE") {
    // imgUrl 또는 base64Image를 받아서 처리
    // [한글주석] 옵션 저장소에서 언더스코어 키로 불러오기
    const apiKeyObj = await new Promise((res) => {
      chrome.storage.sync.get(["openai_api_key", "openai_model"], res);
    });
    const key = apiKeyObj.openai_api_key;
    const model = apiKeyObj.openai_model || "gpt-4-vision-preview";
    let result = { description: "", tags: "" };
    let apiRaw = null;
    let errorMsg = null;
    try {
      if (msg.base64Image) {
        result = await callOpenAIBase64(msg.base64Image, key, model);
      } else {
        result = await callOpenAI(msg.imgUrl, key, model);
      }

      // [한글주석] 결과값 content.js로 전달 (API 원본 응답 포함)
      console.log("[AI생성] 콘텐츠로 메시지 전송 시작", {
        type: "AI_RESULT",
        ...result,
        apiRaw,
      }); // [한글주석] 콘텐츠로 메시지 전송 시작
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "AI_RESULT",
        idx: msg.idx,
        ...result,
        apiRaw,
      });
    } catch (e) {
      errorMsg = e && e.message ? e.message : String(e);
      // [한글주석] 에러 발생 시 상세 정보, 에러 메시지, API 원본 응답 함께 전달
      console.log("[AI생성] 콘텐츠로 메시지 전송(에러)", {
        type: "AI_RESULT",
        error: errorMsg,
        apiRaw,
      }); // [한글주석] 콘텐츠로 메시지 전송(에러)
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "AI_RESULT",
        idx: msg.idx,
        description: "AI 설명 생성 실패",
        tags: "",
        error: errorMsg,
        apiRaw,
      });
    }
  }
});
