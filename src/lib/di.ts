/**
 * Dependency Injection Container
 * 
 * This is the "composition root" where we wire up dependencies.
 * This is the ONLY place where we connect concrete implementations
 * to interfaces.
 * 
 * To swap localStorage for a real database:
 * 1. Create a new repository implementation (e.g., ApiSetRepository)
 * 2. Change the implementation here
 * 3. No other code needs to change!
 */

import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { LocalStorageSetRepository } from '@/infrastructure/persistence/LocalStorageSetRepository';

// Use cases - Set
import { CreateSet } from '@/application/use-cases/set/CreateSet';
import { UpdateSet } from '@/application/use-cases/set/UpdateSet';
import { DeleteSet } from '@/application/use-cases/set/DeleteSet';
import { GetSet } from '@/application/use-cases/set/GetSet';
import { ListSets } from '@/application/use-cases/set/ListSets';

// Use cases - Card
import { AddCard } from '@/application/use-cases/card/AddCard';
import { UpdateCard } from '@/application/use-cases/card/UpdateCard';
import { DeleteCard } from '@/application/use-cases/card/DeleteCard';

// Use cases - Study
import { GenerateTest } from '@/application/use-cases/study/GenerateTest';
import { SubmitAnswer } from '@/application/use-cases/study/SubmitAnswer';

/**
 * Container class
 * 
 * Singleton pattern to ensure we have one instance of each dependency
 */
class DIContainer {
    private static instance: DIContainer;

    // Repository instances
    private _setRepository: ISetRepository | null = null;

    // Use case instances
    private _createSet: CreateSet | null = null;
    private _updateSet: UpdateSet | null = null;
    private _deleteSet: DeleteSet | null = null;
    private _getSet: GetSet | null = null;
    private _listSets: ListSets | null = null;
    private _addCard: AddCard | null = null;
    private _updateCard: UpdateCard | null = null;
    private _deleteCard: DeleteCard | null = null;
    private _generateTest: GenerateTest | null = null;
    private _submitAnswer: SubmitAnswer | null = null;

    private constructor() { }

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    // Repository getters
    get setRepository(): ISetRepository {
        if (!this._setRepository) {
            // TODO: To swap to API, change this line:
            // this._setRepository = new ApiSetRepository();
            this._setRepository = new LocalStorageSetRepository();
        }
        return this._setRepository;
    }

    // Use case getters - Set
    get createSet(): CreateSet {
        if (!this._createSet) {
            this._createSet = new CreateSet(this.setRepository);
        }
        return this._createSet;
    }

    get updateSet(): UpdateSet {
        if (!this._updateSet) {
            this._updateSet = new UpdateSet(this.setRepository);
        }
        return this._updateSet;
    }

    get deleteSet(): DeleteSet {
        if (!this._deleteSet) {
            this._deleteSet = new DeleteSet(this.setRepository);
        }
        return this._deleteSet;
    }

    get getSet(): GetSet {
        if (!this._getSet) {
            this._getSet = new GetSet(this.setRepository);
        }
        return this._getSet;
    }

    get listSets(): ListSets {
        if (!this._listSets) {
            this._listSets = new ListSets(this.setRepository);
        }
        return this._listSets;
    }

    // Use case getters - Card
    get addCard(): AddCard {
        if (!this._addCard) {
            this._addCard = new AddCard(this.setRepository);
        }
        return this._addCard;
    }

    get updateCard(): UpdateCard {
        if (!this._updateCard) {
            this._updateCard = new UpdateCard(this.setRepository);
        }
        return this._updateCard;
    }

    get deleteCard(): DeleteCard {
        if (!this._deleteCard) {
            this._deleteCard = new DeleteCard(this.setRepository);
        }
        return this._deleteCard;
    }

    // Use case getters - Study
    get generateTest(): GenerateTest {
        if (!this._generateTest) {
            this._generateTest = new GenerateTest(this.setRepository);
        }
        return this._generateTest;
    }

    get submitAnswer(): SubmitAnswer {
        if (!this._submitAnswer) {
            this._submitAnswer = new SubmitAnswer();
        }
        return this._submitAnswer;
    }
}

// Export singleton instance
export const container = DIContainer.getInstance();
