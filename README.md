# Quizlet-Like Study App

A modern, clean-architecture study application built with Next.js, TypeScript, and Tailwind CSS. This app replicates core Quizlet features with a focus on maintainability and clear separation of concerns.

![Student-friendly dark theme with modern UI](https://img.shields.io/badge/UI-Student%20Friendly-4255ff)
![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20%26%20Maintainable-23d18b)

## ✨ Features

### Study Set Management
- ✅ Create, edit, and delete study sets
- ✅ Add unlimited flashcards (up to 500 per set)
- ✅ Search and filter sets by title/description
- ✅ Responsive card-based UI
- ✅ **Bulk Import**: Import questions from Word/Excel using custom separators (e.g., for MCQ)

## 📖 User Guide

For detailed instructions on how to use the app, including **Multiple Choice Question Import**, please refer to the [Business Guideline & User Guide](business_guide.md).

### Study Modes

#### 📚 Flashcards
- Flip cards to reveal definitions
- Navigate with next/previous buttons
- Shuffle cards for variety
- Progress tracking

#### 🧠 Learn Mode
- Type answers for instant feedback
- Case-insensitive answer validation
- Track correct/incorrect answers
- Completion summary with score

#### 📝 Test Mode
- Mixed question types (multiple choice + written)
- Randomized questions
- Detailed results review
- Retake functionality

## 🏗️ Architecture

This project follows **Clean Architecture** principles with strict layer separation:

```
┌─────────────────────────────────────────────┐
│              UI Layer (React)               │
│         (Components, Pages, Hooks)          │
└──────────────────┬──────────────────────────┘
                   │ depends on
┌──────────────────▼──────────────────────────┐
│         Application Layer                   │
│    (Use Cases, DTOs, Orchestration)         │
└──────────────────┬──────────────────────────┘
                   │ depends on
┌──────────────────▼──────────────────────────┐
│          Domain Layer                       │
│  (Entities, Value Objects, Services)        │
│         ⚠️ NO DEPENDENCIES ⚠️               │
└──────────────────▲──────────────────────────┘
                   │ implements
┌──────────────────┴──────────────────────────┐
│       Infrastructure Layer                  │
│  (LocalStorage, API adapters, etc.)         │
└─────────────────────────────────────────────┘
```

### Folder Structure

```
E:\Dan\app\Workspace\quizlet\
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Header
│   ├── page.tsx                 # Home page (sets list)
│   └── sets/
│       ├── new/page.tsx         # Create set
│       └── [id]/
│           ├── page.tsx         # Set detail
│           ├── edit/page.tsx    # Edit set
│           └── study/
│               ├── flashcards/page.tsx
│               ├── learn/page.tsx
│               └── test/page.tsx
├── src/
│   ├── domain/                   # ⭐ Business logic core
│   │   ├── entities/            # Set, Card, StudySession
│   │   ├── value-objects/       # SetId, CardId, Answer
│   │   ├── repositories/        # ISetRepository interface
│   │   └── services/            # AnswerValidator, TestGenerator
│   ├── application/              # ⭐ Use cases
│   │   ├── use-cases/
│   │   │   ├── set/            # CreateSet, UpdateSet, etc.
│   │   │   ├── card/           # AddCard, UpdateCard, etc.
│   │   │   └── study/          # GenerateTest, SubmitAnswer
│   │   └── dto/                # Data transfer objects
│   ├── infrastructure/           # Implementation details
│   │   └── persistence/        # LocalStorageSetRepository
│   ├── ui/                      # Presentation layer
│   │   ├── components/
│   │   │   ├── sets/           # SetCard, SetList, SetForm
│   │   │   ├── common/         # EmptyState, LoadingState, etc.
│   │   │   └── layout/         # Header
│   │   └── hooks/              # Custom React hooks
│   └── lib/                     # Shared utilities
│       ├── di.ts               # Dependency injection container
│       └── utils.ts            # Helper functions
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd E:\Dan\app\Workspace\quizlet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 💾 Data Persistence

The app currently uses **localStorage** for data persistence. All study sets are stored in your browser's local storage.

### Swapping to a Real Database

Thanks to the clean architecture, swapping persistence is trivial:

1. **Create a new repository implementation** (e.g., `ApiSetRepository.ts`):
   ```typescript
   export class ApiSetRepository implements ISetRepository {
     async findAll(): Promise<Set[]> {
       const response = await fetch('/api/sets');
       const data = await response.json();
       return data.map(/* convert to domain Set */);
     }
     // ... implement other methods
   }
   ```

2. **Update the DI container** (`src/lib/di.ts`):
   ```typescript
   get setRepository(): ISetRepository {
     if (!this._setRepository) {
       // Change this line:
       this._setRepository = new ApiSetRepository();
     }
     return this._setRepository;
   }
   ```

3. **That's it!** No other code needs to change.

## 🧪 Testing

Run unit tests for domain and application layers:

```bash
npm run test
```

Tests are located in `__tests__/` directories alongside the code they test.

## 🎨 Customization

### Theme
The app uses a student-friendly dark theme with deep blues and purples. Customize colors in `app/globals.css`:

```css
:root {
  --primary: #4255ff;      /* Primary blue */
  --secondary: #ffcd1f;    /* Accent yellow */
  --success: #23d18b;      /* Success green */
  /* ... */
}
```

### Business Logic
All business rules are in the **domain layer** (`src/domain/`). Look for `TODO(business):` comments to find areas marked for customization:

- **Answer validation**: `src/domain/services/AnswerValidator.ts`
  - Add fuzzy matching for typos
  - Support multiple acceptable answers
  - Implement partial credit

- **Test generation**: `src/domain/services/TestGenerator.ts`
  - Add difficulty levels
  - Implement adaptive question selection
  - Support more question types

- **Set limits**: `src/domain/entities/Set.ts`
  - Adjust `MAX_CARDS` constant
  - Add validation rules

## 📚 Key Concepts

### Domain-Driven Design
- **Entities**: `Set`, `Card`, `StudySession` - objects with identity
- **Value Objects**: `SetId`, `CardId`, `Answer` - immutable, compared by value
- **Domain Services**: `AnswerValidator`, `TestGenerator` - business logic that doesn't belong to entities
- **Repository Interface**: `ISetRepository` - abstraction for data access

### Dependency Inversion
The domain layer defines **what it needs** (interfaces), and the infrastructure layer **provides it** (implementations). This makes the business logic independent of frameworks and databases.

### Use Cases
Each use case represents a single user action:
- `CreateSet` - Create a new study set
- `AddCard` - Add a card to a set
- `GenerateTest` - Generate test questions
- etc.

Use cases orchestrate domain logic and coordinate with repositories.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand (minimal client state)
- **Validation**: Zod
- **Icons**: Lucide React
- **Testing**: Vitest

## 📝 TODO Markers

Throughout the codebase, you'll find `TODO(business):` comments marking areas where you can extend business logic:

```typescript
// TODO(business): Implement fuzzy matching for typos
// TODO(business): Add difficulty levels
// TODO(business): Support multiple acceptable answers
```

These are intentionally left for you to implement based on your specific requirements.

## 🤝 Contributing

This is a learning-focused project. Feel free to:
- Add new study modes
- Implement advanced features (spaced repetition, AI hints, etc.)
- Improve the UI/UX
- Add more comprehensive tests

## 📄 License

MIT License - feel free to use this project for learning or as a foundation for your own apps.

## 🙏 Acknowledgments

- Inspired by [Quizlet](https://quizlet.com)
- Built with clean architecture principles
- Designed for student success 🎓

---

**Happy studying! 📚✨**
