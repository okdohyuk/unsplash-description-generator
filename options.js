// 옵션 페이지: 다중 AI API 키/모델 저장 및 제공업체 전환
// 한글 주석만 사용

// 제공업체 전환 처리
function handleProviderChange() {
    const provider = document.querySelector('input[name="provider"]:checked').value;
    const openaiSection = document.getElementById('openai-section');
    const geminiSection = document.getElementById('gemini-section');
    
    if (provider === 'openai') {
        openaiSection.classList.remove('disabled');
        geminiSection.classList.add('disabled');
    } else {
        openaiSection.classList.add('disabled');
        geminiSection.classList.remove('disabled');
    }
}

// 저장 버튼 이벤트
document.getElementById('saveBtn').onclick = function() {
    // 현재 선택된 제공업체 확인
    const provider = document.querySelector('input[name="provider"]:checked').value;
    
    // 입력값 가져오기
    const openaiApiKey = document.getElementById('openaiApiKey').value;
    const openaiModel = document.getElementById('openaiModel').value;
    const geminiApiKey = document.getElementById('geminiApiKey').value;
    const geminiModel = document.getElementById('geminiModel').value;
    
    // 저장할 설정 객체 구성
    const settings = {
        ai_provider: provider,
        openai_api_key: openaiApiKey,
        openai_model: openaiModel,
        gemini_api_key: geminiApiKey,
        gemini_model: geminiModel
    };
    
    // 크롬 스토리지에 저장
    chrome.storage.sync.set(settings, function() {
        const msg = document.getElementById('msg');
        msg.innerText = '설정이 저장되었습니다!';
        msg.className = 'success';
        msg.style.display = 'block';
        
        // 3초 후 메시지 숨기기
        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
    });
};

// 저장된 값 불러오기 및 초기 설정
window.onload = function() {
    // 제공업체 라디오 버튼 이벤트 리스너 추가
    document.querySelectorAll('input[name="provider"]').forEach(radio => {
        radio.addEventListener('change', handleProviderChange);
    });
    
    // 저장된 설정 불러오기
    chrome.storage.sync.get([
        'ai_provider', 
        'openai_api_key', 
        'openai_model', 
        'gemini_api_key', 
        'gemini_model'
    ], function(result) {
        // 제공업체 설정
        if (result.ai_provider) {
            document.querySelector(`input[name="provider"][value="${result.ai_provider}"]`).checked = true;
        }
        
        // OpenAI 설정
        if (result.openai_api_key) {
            document.getElementById('openaiApiKey').value = result.openai_api_key;
        }
        if (result.openai_model) {
            document.getElementById('openaiModel').value = result.openai_model;
        }
        
        // Gemini 설정
        if (result.gemini_api_key) {
            document.getElementById('geminiApiKey').value = result.gemini_api_key;
        }
        if (result.gemini_model) {
            document.getElementById('geminiModel').value = result.gemini_model;
        }
        
        // 초기 UI 상태 설정
        handleProviderChange();
    });
};
