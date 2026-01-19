# Flashcards Study Mode - Implementation Summary

## Tổng quan

Đã triển khai đầy đủ tính năng Flashcards Study Mode theo yêu cầu trong `doc/requirement/study-flashcards/study-flashcards.md`.

## Files đã tạo/sửa đổi

### Domain Layer (Pure Business Logic)
- `src/domain/value-objects/CardKey.ts` - Value object cho card key
- `src/domain/entities/FlashcardsProgress.ts` - Entity quản lý progress state
- `src/domain/repositories/IFlashcardsProgressRepository.ts` - Repository interface

### Application Layer (Use Cases)
- `src/application/use-cases/flashcards/LoadFlashcardsProgress.ts` - Load progress
- `src/application/use-cases/flashcards/SaveFlashcardsProgress.ts` - Save progress
- `src/application/use-cases/flashcards/ResetFlashcardsProgress.ts` - Reset progress

### Infrastructure Layer (Persistence)
- `src/infrastructure/persistence/LocalStorageFlashcardsProgressRepository.ts` - localStorage implementation

### UI Layer (React Components)
- `src/ui/store/flashcardsStore.ts` - Zustand store cho flashcards session
- `src/ui/components/study/Flashcard.tsx` - Component hiển thị card flip
- `src/ui/components/study/ProgressIndicator.tsx` - Component hiển thị progress
- `src/ui/components/study/ConfidenceButtons.tsx` - Buttons Know/Learning
- `src/ui/components/study/ResetProgressModal.tsx` - Modal xác nhận reset

### Pages
- `app/sets/[id]/study/flashcards/page.tsx` - Trang flashcards (đã viết lại hoàn toàn)

### Configuration & Tests
- `playwright.config.ts` - Playwright configuration
- `tests/e2e/flashcards.spec.ts` - E2E tests (T-FC-01 đến T-FC-11)
- `src/lib/di.ts` - Updated với flashcards dependencies
- `package.json` - Added test scripts

## Flashcards State & Persistence Schema

### State Structure (FlashcardsProgress Entity)
```typescript
{
  setId: SetId,
  order: 'original' | 'shuffled',
  shuffledOrder?: string[], // Array of CardKey strings for stable shuffle
  shuffledSeed?: string, // Seed for deterministic shuffle
  index: number, // Current card index (0-based)
  side: 'term' | 'definition', // Current card side
  knownMap: Record<string, CardStatus>, // CardKey -> 'know' | 'learning' | 'unset'
  lastUpdatedAt: Date
}
```

### Persistence (localStorage)
- Key format: `quizlet_flashcards_progress_{setId}`
- Storage: JSON serialized FlashcardsProgress
- Corruption handling: Returns undefined on parse error, triggers fresh start

### CardKey Generation
- Preferred: `card.id` (if available)
- Fallback: `${setId}::${indexInOriginal}`

## Business Rules Mapping

### Flip Interactions
- **BR-FLIP-01**: Click card to flip → `Flashcard.tsx` onClick handler
- **BR-FLIP-02**: Space key to flip → `page.tsx` keyboard handler
- **BR-FLIP-03**: Side resets to term on navigation → `FlashcardsProgress.setIndex()`

### Navigation
- **BR-NAV-01**: Next button/ArrowRight → `flashcardsStore.next()`
- **BR-NAV-02**: Prev button/ArrowLeft → `flashcardsStore.prev()`
- **BR-NAV-03**: Prev disabled at first → `page.tsx` disabled prop
- **BR-NAV-04**: Next disabled at last → `page.tsx` disabled prop

### Know/Learning Actions
- **BR-KNOW-01**: Mark Know → `FlashcardsProgress.markKnow()`
- **BR-LEARN-01**: Mark Learning → `FlashcardsProgress.markLearning()`
- **BR-SET-01**: Overwrite status → Handled in `markKnow`/`markLearning`
- **BR-SET-02**: Unset by clicking again → `flashcardsStore.markKnow`/`markLearning` checks current status

### Progress Indicator
- **BR-PROG-01**: Show x/y indicator → `ProgressIndicator.tsx`
- **BR-PROG-02**: Known/Learning counts → `FlashcardsProgress.getStats()`
- **BR-PROG-03**: Real-time updates → Zustand store reactivity

### Shuffle
- **BR-SHUFF-01**: Toggle ON → `flashcardsStore.toggleShuffle()`
- **BR-SHUFF-02**: Toggle OFF → `flashcardsStore.toggleShuffle()`
- **BR-SHUFF-03**: Persist shuffle state → `LocalStorageFlashcardsProgressRepository.save()`

### Reset Progress
- **BR-RESET-01**: Show confirm modal → `ResetProgressModal.tsx`
- **BR-RESET-02**: Clear progress → `ResetFlashcardsProgress.execute()`
- **BR-RESET-03**: Cancel → Modal close handler

### Persistence
- **BR-PERSIST-01**: Immediate save → `flashcardsStore` actions call `saveFlashcardsProgress`
- **BR-PERSIST-02**: Restore on load → `LoadFlashcardsProgress.execute()`
- **BR-PERSIST-03**: Corruption handling → Try-catch in `LocalStorageFlashcardsProgressRepository.findBySetId()`

### Error/Empty States
- **BR-ERR-01**: Set not found → `page.tsx` error handling
- **BR-EMP-01**: Empty set → `page.tsx` empty state with EmptyState component
- **BR-LOAD-01**: Loading state → `LoadingState` component

## Keyboard Shortcuts

- `Space`: Flip card (BR-FLIP-02)
- `ArrowRight`: Next card (BR-NAV-01)
- `ArrowLeft`: Previous card (BR-NAV-02)
- `K`: Mark as Know (BR-KNOW-01)
- `L`: Mark as Still learning (BR-LEARN-01)
- `S`: Toggle shuffle (BR-SHUFF-01)
- `R`: Open reset modal (BR-RESET-01)
- `Esc`: Close modal (BR-RESET-03)

## Cách chạy E2E Tests

### Cài đặt dependencies (lần đầu)
```bash
# Cài đặt @playwright/test nếu chưa có
npm install --save-dev @playwright/test

# Cài đặt Playwright browsers
npx playwright install
```

### Chạy tests
```bash
# Chạy tất cả E2E tests
npm run test:e2e

# Chạy với UI mode (interactive)
npm run test:e2e:ui

# Chạy một test cụ thể
npx playwright test flashcards.spec.ts
```

### Test Coverage
Tất cả 11 test cases từ test plan đã được implement:
- T-FC-01: Load happy path
- T-FC-02: Flip by click and Space
- T-FC-03: Next/Prev bounds
- T-FC-04: Mark Know and persist
- T-FC-05: Mark Still learning + overwrite
- T-FC-06: Unset behavior
- T-FC-07: Shuffle on/off
- T-FC-08: Reset progress confirm
- T-FC-09: Empty set
- T-FC-10: Not found
- T-FC-11: Keyboard shortcuts

## Kiến trúc

Tuân thủ Clean Architecture:
- **Domain**: Pure entities, value objects, interfaces (no dependencies)
- **Application**: Use cases orchestrate domain logic
- **Infrastructure**: Implements domain interfaces (localStorage)
- **UI**: React components + Zustand store

Dependency flow: UI → Application → Domain ← Infrastructure

## Known Limitations

1. **Auto-advance**: BR-AUTO-ADV-01 (auto-advance after marking) chưa được implement. Có thể thêm sau nếu cần.

2. **Shuffle stability**: Shuffle order được lưu trong `shuffledOrder` array. Nếu set thay đổi (thêm/xóa cards), shuffle order có thể không còn hợp lệ. Hiện tại sẽ tạo shuffle mới trong trường hợp này.

3. **Toast notifications**: Micro-toasts cho "Marked as Know" chưa được implement. UI feedback hiện tại là thông qua button state.

4. **Accessibility**: ARIA labels đã được thêm, nhưng aria-live announcements cho flip chưa được implement.

## Notes

- Tất cả business logic được implement trong domain layer
- Persistence được abstract qua repository interface, dễ dàng swap sang API sau
- State management sử dụng Zustand với immediate persistence
- Tests cover tất cả business rules và edge cases
