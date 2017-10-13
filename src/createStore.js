import { applyMiddleware, createStore, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'

function injectReducer (o, reducer) {
  o.reducers = { ...o.reducers, ...reducer }
  return combineReducers(o.reducers)
}

function injectSaga (o, key, saga) {
  if (o.sagas.hasOwnProperty(key)) {
    return
  }
  o.sagas = { ...o.sagas, [key]: saga }
  o.run(saga)
}

export default function (reducers = {}, middleware = []) {
  const sagaMiddleware = createSagaMiddleware()
  const initialState = {}
  const initialMiddleware = applyMiddleware(sagaMiddleware, ...middleware)
  const sagas = {}
  const run = (...args) => sagaMiddleware.run(...args)
  const dynamicReducers = { reducers }
  const dynamicSagas = { sagas, run }
  const store = {
    ...createStore(
      combineReducers(reducers),
      initialState,
      initialMiddleware
    ),
    injectReducer: (key, reducer) => store.replaceReducer(injectReducer(dynamicReducers, { [key]: reducer })),
    injectSaga: (key, saga) => injectSaga(dynamicSagas, key, saga)
  }
  return store
}
