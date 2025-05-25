// 옵션 페이지: API키/모델 저장
// 한글 주석만 사용

document.getElementById('saveBtn').onclick = function() {
    // 입력값 가져오기
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    // 크롬 스토리지에 저장
    chrome.storage.sync.set({ openai_api_key: apiKey, openai_model: model }, function() {
        document.getElementById('msg').innerText = '저장되었습니다!';
    });
};

// 저장된 값 불러오기
window.onload = function() {
    chrome.storage.sync.get(['openai_api_key', 'openai_model'], function(result) {
        if (result.openai_api_key) document.getElementById('apiKey').value = result.openai_api_key;
        if (result.openai_model) document.getElementById('model').value = result.openai_model;
    });
};
