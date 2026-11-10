import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CurriculumSubject_Key {
  id: string;
  __typename?: 'CurriculumSubject_Key';
}

export interface CurriculumTopic_Key {
  id: string;
  __typename?: 'CurriculumTopic_Key';
}

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

export interface GetCurriculumByTrackVariables {
  kidTrack: string;
}

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

export interface GetKidProgressVariables {
  kidId: string;
}

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

export interface GetTopicQuestionsVariables {
  topicId: string;
}

export interface KidProfile_Key {
  parentUid: string;
  kidId: string;
  __typename?: 'KidProfile_Key';
}

export interface QuestionBankItem_Key {
  id: UUIDString;
  __typename?: 'QuestionBankItem_Key';
}

export interface ResetMyKidsProgressData {
  topicProgress_deleteMany: number;
  kidProfile_deleteMany: number;
}

export interface TopicProgress_Key {
  parentUid: string;
  kidId: string;
  topicId: string;
  __typename?: 'TopicProgress_Key';
}

export interface UpsertKidProgressData {
  kidProfile_upsert: KidProfile_Key;
}

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

export interface UpsertParentProfileData {
  user_upsert: User_Key;
}

export interface UpsertParentProfileVariables {
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  lastActiveDate?: string | null;
}

export interface UpsertTopicProgressData {
  topicProgress_upsert: TopicProgress_Key;
}

export interface UpsertTopicProgressVariables {
  kidId: string;
  topicId: string;
  played: number;
  correct: number;
  bestStreak: number;
  mastered: boolean;
}

export interface User_Key {
  uid: string;
  __typename?: 'User_Key';
}

interface UpsertParentProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertParentProfileVariables): MutationRef<UpsertParentProfileData, UpsertParentProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertParentProfileVariables): MutationRef<UpsertParentProfileData, UpsertParentProfileVariables>;
  operationName: string;
}
export const upsertParentProfileRef: UpsertParentProfileRef;

export function upsertParentProfile(vars: UpsertParentProfileVariables): MutationPromise<UpsertParentProfileData, UpsertParentProfileVariables>;
export function upsertParentProfile(dc: DataConnect, vars: UpsertParentProfileVariables): MutationPromise<UpsertParentProfileData, UpsertParentProfileVariables>;

interface UpsertKidProgressRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertKidProgressVariables): MutationRef<UpsertKidProgressData, UpsertKidProgressVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertKidProgressVariables): MutationRef<UpsertKidProgressData, UpsertKidProgressVariables>;
  operationName: string;
}
export const upsertKidProgressRef: UpsertKidProgressRef;

export function upsertKidProgress(vars: UpsertKidProgressVariables): MutationPromise<UpsertKidProgressData, UpsertKidProgressVariables>;
export function upsertKidProgress(dc: DataConnect, vars: UpsertKidProgressVariables): MutationPromise<UpsertKidProgressData, UpsertKidProgressVariables>;

interface UpsertTopicProgressRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertTopicProgressVariables): MutationRef<UpsertTopicProgressData, UpsertTopicProgressVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertTopicProgressVariables): MutationRef<UpsertTopicProgressData, UpsertTopicProgressVariables>;
  operationName: string;
}
export const upsertTopicProgressRef: UpsertTopicProgressRef;

export function upsertTopicProgress(vars: UpsertTopicProgressVariables): MutationPromise<UpsertTopicProgressData, UpsertTopicProgressVariables>;
export function upsertTopicProgress(dc: DataConnect, vars: UpsertTopicProgressVariables): MutationPromise<UpsertTopicProgressData, UpsertTopicProgressVariables>;

interface ResetMyKidsProgressRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<ResetMyKidsProgressData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<ResetMyKidsProgressData, undefined>;
  operationName: string;
}
export const resetMyKidsProgressRef: ResetMyKidsProgressRef;

export function resetMyKidsProgress(): MutationPromise<ResetMyKidsProgressData, undefined>;
export function resetMyKidsProgress(dc: DataConnect): MutationPromise<ResetMyKidsProgressData, undefined>;

interface GetMyFamilyDashboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyFamilyDashboardData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyFamilyDashboardData, undefined>;
  operationName: string;
}
export const getMyFamilyDashboardRef: GetMyFamilyDashboardRef;

export function getMyFamilyDashboard(options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDashboardData, undefined>;
export function getMyFamilyDashboard(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDashboardData, undefined>;

interface GetKidProgressRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetKidProgressVariables): QueryRef<GetKidProgressData, GetKidProgressVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetKidProgressVariables): QueryRef<GetKidProgressData, GetKidProgressVariables>;
  operationName: string;
}
export const getKidProgressRef: GetKidProgressRef;

export function getKidProgress(vars: GetKidProgressVariables, options?: ExecuteQueryOptions): QueryPromise<GetKidProgressData, GetKidProgressVariables>;
export function getKidProgress(dc: DataConnect, vars: GetKidProgressVariables, options?: ExecuteQueryOptions): QueryPromise<GetKidProgressData, GetKidProgressVariables>;

interface GetCurriculumByTrackRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCurriculumByTrackVariables): QueryRef<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCurriculumByTrackVariables): QueryRef<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;
  operationName: string;
}
export const getCurriculumByTrackRef: GetCurriculumByTrackRef;

export function getCurriculumByTrack(vars: GetCurriculumByTrackVariables, options?: ExecuteQueryOptions): QueryPromise<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;
export function getCurriculumByTrack(dc: DataConnect, vars: GetCurriculumByTrackVariables, options?: ExecuteQueryOptions): QueryPromise<GetCurriculumByTrackData, GetCurriculumByTrackVariables>;

interface GetTopicQuestionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTopicQuestionsVariables): QueryRef<GetTopicQuestionsData, GetTopicQuestionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTopicQuestionsVariables): QueryRef<GetTopicQuestionsData, GetTopicQuestionsVariables>;
  operationName: string;
}
export const getTopicQuestionsRef: GetTopicQuestionsRef;

export function getTopicQuestions(vars: GetTopicQuestionsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopicQuestionsData, GetTopicQuestionsVariables>;
export function getTopicQuestions(dc: DataConnect, vars: GetTopicQuestionsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopicQuestionsData, GetTopicQuestionsVariables>;

