# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyFamilyDashboard*](#getmyfamilydashboard)
  - [*GetKidProgress*](#getkidprogress)
  - [*GetCurriculumByTrack*](#getcurriculumbytrack)
  - [*GetTopicQuestions*](#gettopicquestions)
- [**Mutations**](#mutations)
  - [*UpsertParentProfile*](#upsertparentprofile)
  - [*UpsertKidProgress*](#upsertkidprogress)
  - [*UpsertTopicProgress*](#upserttopicprogress)
  - [*ResetMyKidsProgress*](#resetmykidsprogress)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@kiyuv-learning/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@kiyuv-learning/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@kiyuv-learning/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyFamilyDashboard
You can execute the `GetMyFamilyDashboard` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyFamilyDashboard(options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDashboardData, undefined>;

interface GetMyFamilyDashboardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyFamilyDashboardData, undefined>;
}
export const getMyFamilyDashboardRef: GetMyFamilyDashboardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyFamilyDashboard(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDashboardData, undefined>;

interface GetMyFamilyDashboardRef {
  ...
  (dc: DataConnect): QueryRef<GetMyFamilyDashboardData, undefined>;
}
export const getMyFamilyDashboardRef: GetMyFamilyDashboardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyFamilyDashboardRef:
```typescript
const name = getMyFamilyDashboardRef.operationName;
console.log(name);
```

### Variables
The `GetMyFamilyDashboard` query has no variables.
### Return Type
Recall that executing the `GetMyFamilyDashboard` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyFamilyDashboardData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyFamilyDashboardData {
  user?: {
    uid: string;
    email: string;
    displayName?: string | null;
    photoUrl?: string | null;
    lastActiveDate?: string | null;
    lastSeen: TimestampString;
    kids: ({
      kidId: string;
      name: string;
      emoji?: string | null;
      age?: number | null;
      targetGrade?: string | null;
      stars: number;
      streak: number;
      bestStreak: number;
      totalCorrect: number;
      totalWrong: number;
      badges?: string[] | null;
      updatedAt: TimestampString;
    })[];
    topicStats: ({
      kidId: string;
      topicId: string;
      played: number;
      correct: number;
      bestStreak: number;
      mastered: boolean;
      updatedAt: TimestampString;
    })[];
  } & User_Key;
}
```
### Using `GetMyFamilyDashboard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyFamilyDashboard } from '@kiyuv-learning/dataconnect';


// Call the `getMyFamilyDashboard()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyFamilyDashboard();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyFamilyDashboard(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getMyFamilyDashboard().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetMyFamilyDashboard`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyFamilyDashboardRef } from '@kiyuv-learning/dataconnect';


// Call the `getMyFamilyDashboardRef()` function to get a reference to the query.
const ref = getMyFamilyDashboardRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyFamilyDashboardRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetKidProgress
You can execute the `GetKidProgress` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getKidProgress(vars: GetKidProgressVariables, options?: ExecuteQueryOptions): QueryPromise<GetKidProgressData, GetKidProgressVariables>;

interface GetKidProgressRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetKidProgressVariables): QueryRef<GetKidProgressData, GetKidProgressVariables>;
}
export const getKidProgressRef: GetKidProgressRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getKidProgress(dc: DataConnect, vars: GetKidProgressVariables, options?: ExecuteQueryOptions): QueryPromise<GetKidProgressData, GetKidProgressVariables>;

interface GetKidProgressRef {
  ...
  (dc: DataConnect, vars: GetKidProgressVariables): QueryRef<GetKidProgressData, GetKidProgressVariables>;
}
export const getKidProgressRef: GetKidProgressRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getKidProgressRef:
```typescript
const name = getKidProgressRef.operationName;
console.log(name);
```

### Variables
The `GetKidProgress` query requires an argument of type `GetKidProgressVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetKidProgressVariables {
  kidId: string;
}
```
### Return Type
Recall that executing the `GetKidProgress` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetKidProgressData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetKidProgressData {
  kidProfile?: {
    kidId: string;
    name: string;
    emoji?: string | null;
    age?: number | null;
    targetGrade?: string | null;
    stars: number;
    streak: number;
    bestStreak: number;
    totalCorrect: number;
    totalWrong: number;
    badges?: string[] | null;
    updatedAt: TimestampString;
  };
  topicProgresses: ({
    topicId: string;
    played: number;
    correct: number;
    bestStreak: number;
    mastered: boolean;
    updatedAt: TimestampString;
  })[];
}
```
### Using `GetKidProgress`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getKidProgress, GetKidProgressVariables } from '@kiyuv-learning/dataconnect';

// The `GetKidProgress` query requires an argument of type `GetKidProgressVariables`:
const getKidProgressVars: GetKidProgressVariables = {
  kidId: ..., 
};

// Call the `getKidProgress()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getKidProgress(getKidProgressVars);
// Variables can be defined inline as well.
const { data } = await getKidProgress({ kidId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getKidProgress(dataConnect, getKidProgressVars);

console.log(data.kidProfile);
console.log(data.topicProgresses);

// Or, you can use the `Promise` API.
getKidProgress(getKidProgressVars).then((response) => {
  const data = response.data;
  console.log(data.kidProfile);
  console.log(data.topicProgresses);
});
```

### Using `GetKidProgress`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getKidProgressRef, GetKidProgressVariables } from '@kiyuv-learning/dataconnect';

// The `GetKidProgress` query requires an argument of type `GetKidProgressVariables`:
const getKidProgressVars: GetKidProgressVariables = {
  kidId: ..., 
};

// Call the `getKidProgressRef()` function to get a reference to the query.
const ref = getKidProgressRef(getKidProgressVars);
// Variables can be defined inline as well.
const ref = getKidProgressRef({ kidId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getKidProgressRef(dataConnect, getKidProgressVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.kidProfile);
console.log(data.topicProgresses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.kidProfile);
  console.log(data.topicProgresses);
});
```

## GetCurriculumByTrack
You can execute the `GetCurriculumByTrack` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCurriculumByTrack(vars: GetCurriculumByTrackVariables, options?: ExecuteQueryOptions): QueryPromise<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;

interface GetCurriculumByTrackRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCurriculumByTrackVariables): QueryRef<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;
}
export const getCurriculumByTrackRef: GetCurriculumByTrackRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCurriculumByTrack(dc: DataConnect, vars: GetCurriculumByTrackVariables, options?: ExecuteQueryOptions): QueryPromise<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;

interface GetCurriculumByTrackRef {
  ...
  (dc: DataConnect, vars: GetCurriculumByTrackVariables): QueryRef<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;
}
export const getCurriculumByTrackRef: GetCurriculumByTrackRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCurriculumByTrackRef:
```typescript
const name = getCurriculumByTrackRef.operationName;
console.log(name);
```

### Variables
The `GetCurriculumByTrack` query requires an argument of type `GetCurriculumByTrackVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCurriculumByTrackVariables {
  kidTrack: string;
}
```
### Return Type
Recall that executing the `GetCurriculumByTrack` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCurriculumByTrackData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCurriculumByTrackData {
  curriculumSubjects: ({
    id: string;
    kidTrack: string;
    emoji: string;
    name: string;
    grade: string;
    systems: string[];
    sortOrder: number;
    topics: ({
      id: string;
      name: string;
      difficulty: number;
      generatorKey?: string | null;
      sortOrder: number;
    } & CurriculumTopic_Key)[];
  } & CurriculumSubject_Key)[];
}
```
### Using `GetCurriculumByTrack`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCurriculumByTrack, GetCurriculumByTrackVariables } from '@kiyuv-learning/dataconnect';

// The `GetCurriculumByTrack` query requires an argument of type `GetCurriculumByTrackVariables`:
const getCurriculumByTrackVars: GetCurriculumByTrackVariables = {
  kidTrack: ..., 
};

// Call the `getCurriculumByTrack()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCurriculumByTrack(getCurriculumByTrackVars);
// Variables can be defined inline as well.
const { data } = await getCurriculumByTrack({ kidTrack: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCurriculumByTrack(dataConnect, getCurriculumByTrackVars);

console.log(data.curriculumSubjects);

// Or, you can use the `Promise` API.
getCurriculumByTrack(getCurriculumByTrackVars).then((response) => {
  const data = response.data;
  console.log(data.curriculumSubjects);
});
```

### Using `GetCurriculumByTrack`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCurriculumByTrackRef, GetCurriculumByTrackVariables } from '@kiyuv-learning/dataconnect';

// The `GetCurriculumByTrack` query requires an argument of type `GetCurriculumByTrackVariables`:
const getCurriculumByTrackVars: GetCurriculumByTrackVariables = {
  kidTrack: ..., 
};

// Call the `getCurriculumByTrackRef()` function to get a reference to the query.
const ref = getCurriculumByTrackRef(getCurriculumByTrackVars);
// Variables can be defined inline as well.
const ref = getCurriculumByTrackRef({ kidTrack: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCurriculumByTrackRef(dataConnect, getCurriculumByTrackVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.curriculumSubjects);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.curriculumSubjects);
});
```

## GetTopicQuestions
You can execute the `GetTopicQuestions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTopicQuestions(vars: GetTopicQuestionsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopicQuestionsData, GetTopicQuestionsVariables>;

interface GetTopicQuestionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTopicQuestionsVariables): QueryRef<GetTopicQuestionsData, GetTopicQuestionsVariables>;
}
export const getTopicQuestionsRef: GetTopicQuestionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTopicQuestions(dc: DataConnect, vars: GetTopicQuestionsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopicQuestionsData, GetTopicQuestionsVariables>;

interface GetTopicQuestionsRef {
  ...
  (dc: DataConnect, vars: GetTopicQuestionsVariables): QueryRef<GetTopicQuestionsData, GetTopicQuestionsVariables>;
}
export const getTopicQuestionsRef: GetTopicQuestionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTopicQuestionsRef:
```typescript
const name = getTopicQuestionsRef.operationName;
console.log(name);
```

### Variables
The `GetTopicQuestions` query requires an argument of type `GetTopicQuestionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTopicQuestionsVariables {
  topicId: string;
}
```
### Return Type
Recall that executing the `GetTopicQuestions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTopicQuestionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTopicQuestionsData {
  questionBankItems: ({
    id: UUIDString;
    questionText: string;
    answer: string;
    options: string[];
    hint?: string | null;
    difficulty: number;
  } & QuestionBankItem_Key)[];
}
```
### Using `GetTopicQuestions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTopicQuestions, GetTopicQuestionsVariables } from '@kiyuv-learning/dataconnect';

// The `GetTopicQuestions` query requires an argument of type `GetTopicQuestionsVariables`:
const getTopicQuestionsVars: GetTopicQuestionsVariables = {
  topicId: ..., 
};

// Call the `getTopicQuestions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTopicQuestions(getTopicQuestionsVars);
// Variables can be defined inline as well.
const { data } = await getTopicQuestions({ topicId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTopicQuestions(dataConnect, getTopicQuestionsVars);

console.log(data.questionBankItems);

// Or, you can use the `Promise` API.
getTopicQuestions(getTopicQuestionsVars).then((response) => {
  const data = response.data;
  console.log(data.questionBankItems);
});
```

### Using `GetTopicQuestions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTopicQuestionsRef, GetTopicQuestionsVariables } from '@kiyuv-learning/dataconnect';

// The `GetTopicQuestions` query requires an argument of type `GetTopicQuestionsVariables`:
const getTopicQuestionsVars: GetTopicQuestionsVariables = {
  topicId: ..., 
};

// Call the `getTopicQuestionsRef()` function to get a reference to the query.
const ref = getTopicQuestionsRef(getTopicQuestionsVars);
// Variables can be defined inline as well.
const ref = getTopicQuestionsRef({ topicId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTopicQuestionsRef(dataConnect, getTopicQuestionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.questionBankItems);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.questionBankItems);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertParentProfile
You can execute the `UpsertParentProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertParentProfile(vars: UpsertParentProfileVariables): MutationPromise<UpsertParentProfileData, UpsertParentProfileVariables>;

interface UpsertParentProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertParentProfileVariables): MutationRef<UpsertParentProfileData, UpsertParentProfileVariables>;
}
export const upsertParentProfileRef: UpsertParentProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertParentProfile(dc: DataConnect, vars: UpsertParentProfileVariables): MutationPromise<UpsertParentProfileData, UpsertParentProfileVariables>;

interface UpsertParentProfileRef {
  ...
  (dc: DataConnect, vars: UpsertParentProfileVariables): MutationRef<UpsertParentProfileData, UpsertParentProfileVariables>;
}
export const upsertParentProfileRef: UpsertParentProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertParentProfileRef:
```typescript
const name = upsertParentProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertParentProfile` mutation requires an argument of type `UpsertParentProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertParentProfileVariables {
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  lastActiveDate?: string | null;
}
```
### Return Type
Recall that executing the `UpsertParentProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertParentProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertParentProfileData {
  user_upsert: User_Key;
}
```
### Using `UpsertParentProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertParentProfile, UpsertParentProfileVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertParentProfile` mutation requires an argument of type `UpsertParentProfileVariables`:
const upsertParentProfileVars: UpsertParentProfileVariables = {
  email: ..., 
  displayName: ..., // optional
  photoUrl: ..., // optional
  lastActiveDate: ..., // optional
};

// Call the `upsertParentProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertParentProfile(upsertParentProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertParentProfile({ email: ..., displayName: ..., photoUrl: ..., lastActiveDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertParentProfile(dataConnect, upsertParentProfileVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
upsertParentProfile(upsertParentProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `UpsertParentProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertParentProfileRef, UpsertParentProfileVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertParentProfile` mutation requires an argument of type `UpsertParentProfileVariables`:
const upsertParentProfileVars: UpsertParentProfileVariables = {
  email: ..., 
  displayName: ..., // optional
  photoUrl: ..., // optional
  lastActiveDate: ..., // optional
};

// Call the `upsertParentProfileRef()` function to get a reference to the mutation.
const ref = upsertParentProfileRef(upsertParentProfileVars);
// Variables can be defined inline as well.
const ref = upsertParentProfileRef({ email: ..., displayName: ..., photoUrl: ..., lastActiveDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertParentProfileRef(dataConnect, upsertParentProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

## UpsertKidProgress
You can execute the `UpsertKidProgress` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertKidProgress(vars: UpsertKidProgressVariables): MutationPromise<UpsertKidProgressData, UpsertKidProgressVariables>;

interface UpsertKidProgressRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertKidProgressVariables): MutationRef<UpsertKidProgressData, UpsertKidProgressVariables>;
}
export const upsertKidProgressRef: UpsertKidProgressRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertKidProgress(dc: DataConnect, vars: UpsertKidProgressVariables): MutationPromise<UpsertKidProgressData, UpsertKidProgressVariables>;

interface UpsertKidProgressRef {
  ...
  (dc: DataConnect, vars: UpsertKidProgressVariables): MutationRef<UpsertKidProgressData, UpsertKidProgressVariables>;
}
export const upsertKidProgressRef: UpsertKidProgressRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertKidProgressRef:
```typescript
const name = upsertKidProgressRef.operationName;
console.log(name);
```

### Variables
The `UpsertKidProgress` mutation requires an argument of type `UpsertKidProgressVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertKidProgressVariables {
  kidId: string;
  name: string;
  emoji?: string | null;
  age?: number | null;
  targetGrade?: string | null;
  stars: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  badges?: string[] | null;
}
```
### Return Type
Recall that executing the `UpsertKidProgress` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertKidProgressData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertKidProgressData {
  kidProfile_upsert: KidProfile_Key;
}
```
### Using `UpsertKidProgress`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertKidProgress, UpsertKidProgressVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertKidProgress` mutation requires an argument of type `UpsertKidProgressVariables`:
const upsertKidProgressVars: UpsertKidProgressVariables = {
  kidId: ..., 
  name: ..., 
  emoji: ..., // optional
  age: ..., // optional
  targetGrade: ..., // optional
  stars: ..., 
  streak: ..., 
  bestStreak: ..., 
  totalCorrect: ..., 
  totalWrong: ..., 
  badges: ..., // optional
};

// Call the `upsertKidProgress()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertKidProgress(upsertKidProgressVars);
// Variables can be defined inline as well.
const { data } = await upsertKidProgress({ kidId: ..., name: ..., emoji: ..., age: ..., targetGrade: ..., stars: ..., streak: ..., bestStreak: ..., totalCorrect: ..., totalWrong: ..., badges: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertKidProgress(dataConnect, upsertKidProgressVars);

console.log(data.kidProfile_upsert);

// Or, you can use the `Promise` API.
upsertKidProgress(upsertKidProgressVars).then((response) => {
  const data = response.data;
  console.log(data.kidProfile_upsert);
});
```

### Using `UpsertKidProgress`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertKidProgressRef, UpsertKidProgressVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertKidProgress` mutation requires an argument of type `UpsertKidProgressVariables`:
const upsertKidProgressVars: UpsertKidProgressVariables = {
  kidId: ..., 
  name: ..., 
  emoji: ..., // optional
  age: ..., // optional
  targetGrade: ..., // optional
  stars: ..., 
  streak: ..., 
  bestStreak: ..., 
  totalCorrect: ..., 
  totalWrong: ..., 
  badges: ..., // optional
};

// Call the `upsertKidProgressRef()` function to get a reference to the mutation.
const ref = upsertKidProgressRef(upsertKidProgressVars);
// Variables can be defined inline as well.
const ref = upsertKidProgressRef({ kidId: ..., name: ..., emoji: ..., age: ..., targetGrade: ..., stars: ..., streak: ..., bestStreak: ..., totalCorrect: ..., totalWrong: ..., badges: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertKidProgressRef(dataConnect, upsertKidProgressVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.kidProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.kidProfile_upsert);
});
```

## UpsertTopicProgress
You can execute the `UpsertTopicProgress` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertTopicProgress(vars: UpsertTopicProgressVariables): MutationPromise<UpsertTopicProgressData, UpsertTopicProgressVariables>;

interface UpsertTopicProgressRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertTopicProgressVariables): MutationRef<UpsertTopicProgressData, UpsertTopicProgressVariables>;
}
export const upsertTopicProgressRef: UpsertTopicProgressRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertTopicProgress(dc: DataConnect, vars: UpsertTopicProgressVariables): MutationPromise<UpsertTopicProgressData, UpsertTopicProgressVariables>;

interface UpsertTopicProgressRef {
  ...
  (dc: DataConnect, vars: UpsertTopicProgressVariables): MutationRef<UpsertTopicProgressData, UpsertTopicProgressVariables>;
}
export const upsertTopicProgressRef: UpsertTopicProgressRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertTopicProgressRef:
```typescript
const name = upsertTopicProgressRef.operationName;
console.log(name);
```

### Variables
The `UpsertTopicProgress` mutation requires an argument of type `UpsertTopicProgressVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertTopicProgressVariables {
  kidId: string;
  topicId: string;
  played: number;
  correct: number;
  bestStreak: number;
  mastered: boolean;
}
```
### Return Type
Recall that executing the `UpsertTopicProgress` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertTopicProgressData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertTopicProgressData {
  topicProgress_upsert: TopicProgress_Key;
}
```
### Using `UpsertTopicProgress`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertTopicProgress, UpsertTopicProgressVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertTopicProgress` mutation requires an argument of type `UpsertTopicProgressVariables`:
const upsertTopicProgressVars: UpsertTopicProgressVariables = {
  kidId: ..., 
  topicId: ..., 
  played: ..., 
  correct: ..., 
  bestStreak: ..., 
  mastered: ..., 
};

// Call the `upsertTopicProgress()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertTopicProgress(upsertTopicProgressVars);
// Variables can be defined inline as well.
const { data } = await upsertTopicProgress({ kidId: ..., topicId: ..., played: ..., correct: ..., bestStreak: ..., mastered: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertTopicProgress(dataConnect, upsertTopicProgressVars);

console.log(data.topicProgress_upsert);

// Or, you can use the `Promise` API.
upsertTopicProgress(upsertTopicProgressVars).then((response) => {
  const data = response.data;
  console.log(data.topicProgress_upsert);
});
```

### Using `UpsertTopicProgress`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertTopicProgressRef, UpsertTopicProgressVariables } from '@kiyuv-learning/dataconnect';

// The `UpsertTopicProgress` mutation requires an argument of type `UpsertTopicProgressVariables`:
const upsertTopicProgressVars: UpsertTopicProgressVariables = {
  kidId: ..., 
  topicId: ..., 
  played: ..., 
  correct: ..., 
  bestStreak: ..., 
  mastered: ..., 
};

// Call the `upsertTopicProgressRef()` function to get a reference to the mutation.
const ref = upsertTopicProgressRef(upsertTopicProgressVars);
// Variables can be defined inline as well.
const ref = upsertTopicProgressRef({ kidId: ..., topicId: ..., played: ..., correct: ..., bestStreak: ..., mastered: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertTopicProgressRef(dataConnect, upsertTopicProgressVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.topicProgress_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.topicProgress_upsert);
});
```

## ResetMyKidsProgress
You can execute the `ResetMyKidsProgress` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
resetMyKidsProgress(): MutationPromise<ResetMyKidsProgressData, undefined>;

interface ResetMyKidsProgressRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<ResetMyKidsProgressData, undefined>;
}
export const resetMyKidsProgressRef: ResetMyKidsProgressRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
resetMyKidsProgress(dc: DataConnect): MutationPromise<ResetMyKidsProgressData, undefined>;

interface ResetMyKidsProgressRef {
  ...
  (dc: DataConnect): MutationRef<ResetMyKidsProgressData, undefined>;
}
export const resetMyKidsProgressRef: ResetMyKidsProgressRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the resetMyKidsProgressRef:
```typescript
const name = resetMyKidsProgressRef.operationName;
console.log(name);
```

### Variables
The `ResetMyKidsProgress` mutation has no variables.
### Return Type
Recall that executing the `ResetMyKidsProgress` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ResetMyKidsProgressData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ResetMyKidsProgressData {
  topicProgress_deleteMany: number;
  kidProfile_deleteMany: number;
}
```
### Using `ResetMyKidsProgress`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, resetMyKidsProgress } from '@kiyuv-learning/dataconnect';


// Call the `resetMyKidsProgress()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await resetMyKidsProgress();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await resetMyKidsProgress(dataConnect);

console.log(data.topicProgress_deleteMany);
console.log(data.kidProfile_deleteMany);

// Or, you can use the `Promise` API.
resetMyKidsProgress().then((response) => {
  const data = response.data;
  console.log(data.topicProgress_deleteMany);
  console.log(data.kidProfile_deleteMany);
});
```

### Using `ResetMyKidsProgress`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, resetMyKidsProgressRef } from '@kiyuv-learning/dataconnect';


// Call the `resetMyKidsProgressRef()` function to get a reference to the mutation.
const ref = resetMyKidsProgressRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = resetMyKidsProgressRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.topicProgress_deleteMany);
console.log(data.kidProfile_deleteMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.topicProgress_deleteMany);
  console.log(data.kidProfile_deleteMany);
});
```

