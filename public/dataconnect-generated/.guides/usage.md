# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertParentProfile, upsertKidProgress, upsertTopicProgress, resetMyKidsProgress, getMyFamilyDashboard, getKidProgress, getCurriculumByTrack, getTopicQuestions } from '@kiyuv-learning/dataconnect';


// Operation UpsertParentProfile:  For variables, look at type UpsertParentProfileVars in ../index.d.ts
const { data } = await UpsertParentProfile(dataConnect, upsertParentProfileVars);

// Operation UpsertKidProgress:  For variables, look at type UpsertKidProgressVars in ../index.d.ts
const { data } = await UpsertKidProgress(dataConnect, upsertKidProgressVars);

// Operation UpsertTopicProgress:  For variables, look at type UpsertTopicProgressVars in ../index.d.ts
const { data } = await UpsertTopicProgress(dataConnect, upsertTopicProgressVars);

// Operation ResetMyKidsProgress: 
const { data } = await ResetMyKidsProgress(dataConnect);

// Operation GetMyFamilyDashboard: 
const { data } = await GetMyFamilyDashboard(dataConnect);

// Operation GetKidProgress:  For variables, look at type GetKidProgressVars in ../index.d.ts
const { data } = await GetKidProgress(dataConnect, getKidProgressVars);

// Operation GetCurriculumByTrack:  For variables, look at type GetCurriculumByTrackVars in ../index.d.ts
const { data } = await GetCurriculumByTrack(dataConnect, getCurriculumByTrackVars);

// Operation GetTopicQuestions:  For variables, look at type GetTopicQuestionsVars in ../index.d.ts
const { data } = await GetTopicQuestions(dataConnect, getTopicQuestionsVars);


```