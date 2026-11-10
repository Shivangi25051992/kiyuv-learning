const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'kiyuv-learning-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const upsertParentProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertParentProfile', inputVars);
}
upsertParentProfileRef.operationName = 'UpsertParentProfile';
exports.upsertParentProfileRef = upsertParentProfileRef;

exports.upsertParentProfile = function upsertParentProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertParentProfileRef(dcInstance, inputVars));
}
;

const upsertKidProgressRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertKidProgress', inputVars);
}
upsertKidProgressRef.operationName = 'UpsertKidProgress';
exports.upsertKidProgressRef = upsertKidProgressRef;

exports.upsertKidProgress = function upsertKidProgress(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertKidProgressRef(dcInstance, inputVars));
}
;

const upsertTopicProgressRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertTopicProgress', inputVars);
}
upsertTopicProgressRef.operationName = 'UpsertTopicProgress';
exports.upsertTopicProgressRef = upsertTopicProgressRef;

exports.upsertTopicProgress = function upsertTopicProgress(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertTopicProgressRef(dcInstance, inputVars));
}
;

const resetMyKidsProgressRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ResetMyKidsProgress');
}
resetMyKidsProgressRef.operationName = 'ResetMyKidsProgress';
exports.resetMyKidsProgressRef = resetMyKidsProgressRef;

exports.resetMyKidsProgress = function resetMyKidsProgress(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(resetMyKidsProgressRef(dcInstance, inputVars));
}
;

const getMyFamilyDashboardRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyFamilyDashboard');
}
getMyFamilyDashboardRef.operationName = 'GetMyFamilyDashboard';
exports.getMyFamilyDashboardRef = getMyFamilyDashboardRef;

exports.getMyFamilyDashboard = function getMyFamilyDashboard(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyFamilyDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getKidProgressRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetKidProgress', inputVars);
}
getKidProgressRef.operationName = 'GetKidProgress';
exports.getKidProgressRef = getKidProgressRef;

exports.getKidProgress = function getKidProgress(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getKidProgressRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getCurriculumByTrackRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurriculumByTrack', inputVars);
}
getCurriculumByTrackRef.operationName = 'GetCurriculumByTrack';
exports.getCurriculumByTrackRef = getCurriculumByTrackRef;

exports.getCurriculumByTrack = function getCurriculumByTrack(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getCurriculumByTrackRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getTopicQuestionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTopicQuestions', inputVars);
}
getTopicQuestionsRef.operationName = 'GetTopicQuestions';
exports.getTopicQuestionsRef = getTopicQuestionsRef;

exports.getTopicQuestions = function getTopicQuestions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getTopicQuestionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
