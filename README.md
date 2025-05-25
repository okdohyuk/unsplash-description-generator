# Unsplash AI 태그/설명 자동입력 크롬 확장

Unsplash 이미지 업로드 시 AI(OpenAI API)를 활용해 사진 설명과 태그를 자동으로 생성하고 입력해주는 크롬 익스텐션입니다.

## 주요 기능

- 업로드 창에서 "AI생성" 버튼 클릭 시, 업로드된 모든 이미지에 대해 AI가 자동으로 설명/태그 생성 및 입력
- OpenAI 기반 이미지 분석 및 자연어 태그/설명 생성
- 태그/설명 입력란 자동 탐지 및 입력 (다중 이미지 지원)
- 직관적이고 간단한 UI

## 설치 및 사용법

1. 이 저장소를 클론 또는 다운로드합니다.
2. 크롬 확장 프로그램 페이지(chrome://extensions)에서 "압축해제된 확장 프로그램 로드" 클릭 후, 이 폴더를 선택합니다.
3. Unsplash 업로드 창에서 "AI생성" 버튼을 클릭하면 자동으로 설명/태그가 입력됩니다.
4. OpenAI API 키 및 모델은 옵션 페이지에서 직접 입력/설정할 수 있습니다.

## 환경설정

- OpenAI API 키 필요 (옵션 페이지에서 입력)
- 지원 모델: gpt-4-vision-preview, gpt-4-turbo 등

## 기여 및 이슈

- Pull Request, Issue 환영합니다!
- 버그, 개선사항, 제안 등은 [GitHub Issues](https://github.com/okdohyuk/unsplash-description-generator/issues)로 남겨주세요.

## 라이선스

MIT License

---

### 문의

- 개발자: okdohyuk
- 이메일: okdohyuk@gmail.com
