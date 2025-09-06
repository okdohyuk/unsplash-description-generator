// 옵션 페이지: JSON 기반 다중 AI API 키/모델 설정 (OpenAI, Gemini, Claude)
// 한글 주석만 사용

// AI 모델 설정 데이터
let aiModelsConfig = null;

// JSON 설정 로드
async function loadAIConfig() {
    try {
        const response = await fetch(chrome.runtime.getURL('ai-models-config.json'));
        aiModelsConfig = await response.json();
        return aiModelsConfig;
    } catch (error) {
        console.error('설정 로드 실패:', error);
        return null;
    }
}

// 제공업체 카드UI 생성
function renderProviderCards() {
    const container = document.getElementById('provider-cards');
    const providers = aiModelsConfig.providers;
    
    container.innerHTML = Object.entries(providers).map(([key, provider], index) => `
        <label class="provider-option cursor-pointer">
            <input type="radio" name="provider" value="${key}" ${index === 0 ? 'checked' : ''} class="sr-only">
            <div class="provider-card border-2 border-gray-200 p-4 rounded-lg transition-all hover:shadow-md" data-provider="${key}">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-800">${provider.icon} ${provider.name}</h3>
                    <div class="provider-indicator w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                </div>
                <p class="text-sm text-gray-600">${provider.description}</p>
            </div>
        </label>
    `).join('');
}

// 설정 섹션 UI 생성
function renderConfigSections() {
    const container = document.getElementById('config-sections');
    const providers = aiModelsConfig.providers;
    
    container.innerHTML = Object.entries(providers).map(([key, provider]) => {
        const colorMap = {
            green: { bg: 'bg-green-100', text: 'text-green-600', ring: 'focus:ring-green-500', btn: 'bg-green-600 hover:bg-green-700' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'focus:ring-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'focus:ring-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' }
        };
        const colors = colorMap[provider.color] || colorMap.green;
        
        return `
            <div class="config-section bg-white rounded-xl shadow-lg p-6 mb-6 opacity-50 pointer-events-none" id="${key}-section">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <div class="w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 ${colors.text}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    ${provider.icon} ${provider.name} 설정
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div class="flex gap-2 mb-2">
                            <input type="password" id="${key}ApiKey" placeholder="${provider.keyPlaceholder}" 
                                   class="flex-1 px-4 py-3 border border-gray-300 rounded-lg ${colors.ring} focus:border-transparent transition-all" />
                            <button type="button" id="${key}LoginBtn" 
                                    class="px-4 py-3 ${colors.btn} text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                로그인
                            </button>
                        </div>
                        <p class="text-xs text-gray-500">${provider.name} 계정에 로그인하여 API 키를 발급받으세요</p>
                        <div id="${key}Status" class="mt-2 text-xs hidden"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">모델</label>
                        <div class="relative">
                            <select id="${key}Model" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg ${colors.ring} focus:border-transparent appearance-none bg-white">
                                ${provider.models.map(model => 
                                    `<option value="${model.id}" ${model.recommended ? 'selected' : ''}>
                                        ${model.name}${model.description ? ` (${model.description})` : ''}
                                    </option>`
                                ).join('')}
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        <div id="${key}CustomModel" class="mt-2 hidden">
                            <input type="text" id="${key}CustomModelInput" placeholder="모델명을 직접 입력하세요" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg ${colors.ring} focus:border-transparent transition-all" />
                            <p class="text-xs text-gray-500 mt-1">최신 모델이나 특수 모델을 직접 입력하세요</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 정보 카드 UI 생성
function renderInfoCards() {
    const container = document.getElementById('provider-info-cards');
    const providers = aiModelsConfig.providers;
    
    const colorMap = {
        green: 'bg-green-50 border-green-200 text-green-800 text-green-600 text-green-500',
        blue: 'bg-blue-50 border-blue-200 text-blue-800 text-blue-600 text-blue-500',
        purple: 'bg-purple-50 border-purple-200 text-purple-800 text-purple-600 text-purple-500'
    };
    
    container.innerHTML = Object.entries(providers).map(([key, provider]) => {
        const colors = colorMap[provider.color] || colorMap.green;
        const colorClasses = colors.split(' ');
        
        return `
            <div class="${colorClasses[0]} p-3 rounded-lg border ${colorClasses[1]}">
                <h4 class="font-medium ${colorClasses[2]} text-sm mb-1">${provider.icon} ${provider.name}</h4>
                <p class="text-xs ${colorClasses[3]}">${provider.description}</p>
                <p class="text-xs ${colorClasses[4]} mt-1">요금: ${provider.pricing}</p>
            </div>
        `;
    }).join('');
}

// 제공업체 전환 처리
function handleProviderChange() {
    const provider = document.querySelector('input[name="provider"]:checked').value;
    
    // 모든 섹션 비활성화
    document.querySelectorAll('.config-section').forEach(section => {
        section.classList.add('opacity-50', 'pointer-events-none');
    });
    
    // 모든 제공업체 카드 스타일 초기화
    document.querySelectorAll('.provider-card').forEach(card => {
        card.className = 'provider-card border-2 border-gray-200 p-4 rounded-lg transition-all hover:shadow-md';
        const indicator = card.querySelector('.provider-indicator');
        if (indicator) {
            indicator.className = 'provider-indicator w-4 h-4 border-2 border-gray-300 rounded-full';
        }
    });
    
    // 선택된 제공업체에 따른 처리
    const selectedSection = document.getElementById(`${provider}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('opacity-50', 'pointer-events-none');
    }
    
    const selectedCard = document.querySelector(`input[value="${provider}"]`)?.parentNode.querySelector('.provider-card');
    if (selectedCard && aiModelsConfig?.providers[provider]) {
        const providerConfig = aiModelsConfig.providers[provider];
        const colorMap = {
            green: { card: 'border-green-200 bg-green-50', indicator: 'border-green-500 bg-green-500 rounded-full' },
            blue: { card: 'border-blue-200 bg-blue-50', indicator: 'border-blue-500 bg-blue-500 rounded-full' },
            purple: { card: 'border-purple-200 bg-purple-50', indicator: 'border-purple-500 bg-purple-500 rounded-full' }
        };
        const colors = colorMap[providerConfig.color] || colorMap.green;
        
        selectedCard.className = `provider-card border-2 ${colors.card} p-4 rounded-lg transition-all hover:shadow-md`;
        const indicator = selectedCard.querySelector('.provider-indicator');
        if (indicator) {
            indicator.className = `provider-indicator w-4 h-4 border-2 ${colors.indicator}`;
        }
    }
}

// 모델 선택 변경 핸들러
function handleModelChange(provider, modelSelect) {
    const customDiv = document.getElementById(`${provider}CustomModel`);
    const customInput = document.getElementById(`${provider}CustomModelInput`);
    
    if (modelSelect.value === 'custom') {
        customDiv.classList.remove('hidden');
        customInput.focus();
    } else {
        customDiv.classList.add('hidden');
        customInput.value = '';
    }
}

// 모델 선택 이벤트 리스너 설정
function setupModelChangeListeners() {
    Object.keys(aiModelsConfig.providers).forEach(provider => {
        const modelSelect = document.getElementById(`${provider}Model`);
        if (modelSelect) {
            modelSelect.addEventListener('change', () => handleModelChange(provider, modelSelect));
        }
    });
}

// 로그인 버튼 이벤트 핸들러
function setupLoginButtons() {
    Object.entries(aiModelsConfig.providers).forEach(([key, provider]) => {
        const loginBtn = document.getElementById(`${key}LoginBtn`);
        if (loginBtn) {
            loginBtn.onclick = function() {
                chrome.tabs.create({ url: provider.loginUrl });
                showLoginGuide(key, provider);
            };
        }
    });
}

// 로그인 가이드 표시
function showLoginGuide(provider, config) {
    const statusElement = document.getElementById(`${provider}Status`);
    const colorMap = {
        green: 'text-green-600 bg-green-50 border border-green-200',
        blue: 'text-blue-600 bg-blue-50 border border-blue-200',
        purple: 'text-purple-600 bg-purple-50 border border-purple-200'
    };
    
    const color = colorMap[config.color] || colorMap.green;
    const message = `새 창에서 ${config.name}에 로그인하고 API 키를 생성하여 복사한 후 여기에 붙여넣으세요.`;
    
    if (statusElement) {
        statusElement.className = `mt-2 text-xs p-2 rounded ${color}`;
        statusElement.textContent = message;
        statusElement.classList.remove('hidden');
        
        // 10초 후 메시지 숨기기
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 10000);
    }
}

// API 키 유효성 검사 (JSON 설정 기반)
function validateApiKey(provider, apiKey) {
    const config = aiModelsConfig.providers[provider];
    if (!config || !config.keyPattern) return false;
    
    const pattern = new RegExp(config.keyPattern);
    return pattern.test(apiKey);
}

// API 키 입력 시 실시간 유효성 검사
function setupApiKeyValidation() {
    Object.keys(aiModelsConfig.providers).forEach(provider => {
        const apiKeyInput = document.getElementById(`${provider}ApiKey`);
        const statusElement = document.getElementById(`${provider}Status`);
        
        if (apiKeyInput && statusElement) {
            apiKeyInput.addEventListener('input', function() {
                const apiKey = this.value.trim();
                
                if (apiKey.length === 0) {
                    statusElement.classList.add('hidden');
                    return;
                }
                
                if (validateApiKey(provider, apiKey)) {
                    statusElement.className = 'mt-2 text-xs p-2 rounded text-green-600 bg-green-50 border border-green-200';
                    statusElement.textContent = '✓ 올바른 API 키 형식입니다.';
                    statusElement.classList.remove('hidden');
                } else {
                    statusElement.className = 'mt-2 text-xs p-2 rounded text-red-600 bg-red-50 border border-red-200';
                    statusElement.textContent = '⚠ API 키 형식이 올바르지 않습니다.';
                    statusElement.classList.remove('hidden');
                }
            });
        }
    });
}

// 저장 버튼 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.onclick = function() {
            // 현재 선택된 제공업체 확인
            const provider = document.querySelector('input[name="provider"]:checked')?.value;
            if (!provider) return;
            
            // 입력값 가져오기 및 설정 객체 구성
            const settings = { ai_provider: provider };
            
            Object.keys(aiModelsConfig.providers).forEach(providerKey => {
                const apiKeyElement = document.getElementById(`${providerKey}ApiKey`);
                const modelSelect = document.getElementById(`${providerKey}Model`);
                const customModelInput = document.getElementById(`${providerKey}CustomModelInput`);
                
                const apiKey = apiKeyElement ? apiKeyElement.value : '';
                let model = modelSelect ? modelSelect.value : '';
                
                // 직접 입력 모델 처리
                if (model === 'custom' && customModelInput && customModelInput.value.trim()) {
                    model = customModelInput.value.trim();
                }
                
                settings[`${providerKey}_api_key`] = apiKey;
                settings[`${providerKey}_model`] = model;
            });
            
            // 저장 버튼 로딩 상태 표시
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>저장 중...';
            saveBtn.disabled = true;
            
            // 크롬 스토리지에 저장
            chrome.storage.sync.set(settings, function() {
                // 저장 버튼 원상복구
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
                
                // 성공 메시지 표시
                const msg = document.getElementById('msg');
                if (msg) {
                    msg.innerHTML = '<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"><strong>성공!</strong> 설정이 저장되었습니다.</div>';
                    msg.classList.remove('hidden');
                    
                    // 3초 후 메시지 숨기기
                    setTimeout(() => {
                        msg.classList.add('hidden');
                    }, 3000);
                }
            });
        };
    }
});

// 저장된 값 불러오기 및 초기 설정 - JSON 기반 다중 AI 지원
window.onload = async function() {
    // AI 모델 설정 로드
    aiModelsConfig = await loadAIConfig();
    if (!aiModelsConfig) {
        console.error('설정 로드 실패');
        return;
    }
    
    // UI 렌더링
    renderProviderCards();
    renderConfigSections();
    renderInfoCards();
    
    // 제공업체 라디오 버튼 이벤트 리스너 추가
    document.querySelectorAll('input[name="provider"]').forEach(radio => {
        radio.addEventListener('change', handleProviderChange);
    });
    
    // 저장된 설정 불러오기
    const storageKeys = ['ai_provider'];
    Object.keys(aiModelsConfig.providers).forEach(provider => {
        storageKeys.push(`${provider}_api_key`, `${provider}_model`);
    });
    
    chrome.storage.sync.get(storageKeys, function(result) {
        // 제공업체 설정
        if (result.ai_provider) {
            const providerRadio = document.querySelector(`input[name="provider"][value="${result.ai_provider}"]`);
            if (providerRadio) providerRadio.checked = true;
        }
        
        // 각 제공업체의 API 키와 모델 설정
        Object.keys(aiModelsConfig.providers).forEach(provider => {
            const apiKeyElement = document.getElementById(`${provider}ApiKey`);
            const modelElement = document.getElementById(`${provider}Model`);
            const customModelInput = document.getElementById(`${provider}CustomModelInput`);
            
            if (result[`${provider}_api_key`] && apiKeyElement) {
                apiKeyElement.value = result[`${provider}_api_key`];
            }
            
            if (result[`${provider}_model`] && modelElement) {
                const savedModel = result[`${provider}_model`];
                const modelExists = Array.from(modelElement.options).some(option => option.value === savedModel);
                
                if (modelExists) {
                    modelElement.value = savedModel;
                } else {
                    // 직접 입력된 모델인 경우
                    modelElement.value = 'custom';
                    if (customModelInput) {
                        customModelInput.value = savedModel;
                        document.getElementById(`${provider}CustomModel`).classList.remove('hidden');
                    }
                }
            }
        });
        
        // 초기 UI 상태 설정
        handleProviderChange();
    });
    
    // 이벤트 리스너 설정
    setupLoginButtons();
    setupApiKeyValidation();
    setupModelChangeListeners();
};