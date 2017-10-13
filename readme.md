# react-redux-modules

Yet another take on modularizing redux-connected react components intended to reduce boilerplate and give modules a structure.

## Module structure

A module consists of:

* A container
* A reducer
* A saga

The module's index exports actions, selectors, and types, and a React component as default. The exported component is connected to the redux store and adds the module's reducer and saga to the redux root reducer.

The *createModule()* function is used to perform "globalization" of actions, selectors, and types. The first argument is a "path" that is used as a prefix for action types. This sets the module's namespace so that action types defined by the module won't conflict with other modules.

```js
// index.js
import { createModule } from '@ttoohey/react-redux-modules'
import Container from './Container'
import saga from './saga'
import reducer, * as fromReducer from './reducer'

const module = createModule('modules/counter', fromReducer, Container)
  .withSaga(saga)
  .withReducer(reducer)

export const actions = module.actions()
export const selectors = module.selectors()
export const types = module.types()
export default module.container()
```

The reducer follows the 'ducks' pattern, mostly. The *reducer.js* script exports:
* actions
* types
* selectors
* and a reducer as default

The reducer exports are all locally scoped. The module index re-exports these to a global scope by prefixing the module's 'path' to action types.

An example reducer

```js
// reducer.js
import { createReducer } from 'redux-create-reducer'

/*
 * Action Types
 */
const SET_COUNTER = 'SET_COUNTER'
const INCREMENT = 'INCREMENT'

/* 
 * Action Creators
 */
 const incrementCounter = () => ({
   type: INCREMENT
 })

const setCounter = value => ({
  type: SET_COUNTER,
  payload: value
})

/* 
 * Selectos
 */
const getCounterValue = state => state

/* 
 * Reducers
 */
const handleSetCounter = (state, action) => action.payload

/* 
 * Exports
 */
export const types = {
  SET_COUNTER,
  INCREMENT
}

export const actions = {
  incrementCounter,
  setCounter
}

export const selectors = {
  getCounterValue
}

export const handlers = {
  [SET_COUNTER]: handleSetCounter
}

export const initialState = 0

export default createReducer(initialState, handlers)
```

For asynchrounous actions sagas are used. The *saga.js* script imports the globally scoped selectors, actions and types from the module index. The default export of *saga.js* must be a generator function that implements the logic for handling actions.

An example saga

```js
// saga.js
import { put, select, takeEvery } from 'redux-saga/effects'
import { selectors, actions, types } from '.'

function* handleIncrement() {
  const value = yield select(selectors.getCounterValue)
  yield put(actions.setCounter(value + 1))
}

export default function* () {
  yield takeEvery(types.INCREMENT, handleIncrement)
}
```

The container imports actions and selectors from the module index.

```js
// Container.js
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Counter from './components/Counter'
import { actions, selectors } from '.'

const mapStateToProps = state => ({
  count: selectors.getCounterValue(state)
})

const mapDispatchToProps = dispatch => bindActionCreators({
  onIncrement: actions.incrementCounter
}, dispatch)

export default connect(mapStateToProps,mapDispatchToProps)(Counter)
```

To complete the example, the module shows a counter with a button to increment the count.

```js
// components/Counter.js
import React from 'react'
const Counter = props => (
  <div>
    <div>Counter value: {props.count}</div>
    <div><button onClick={() => props.onIncrement()}>Increment</button></div>
  </div>
)
export default Counter
```

The module can be shown in a route.

```js
// routes.js
import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Counter from 'modules/counter'

const Routes = () => (
  <Switch>
    {/* ... other routes ... */}
    <Route path='/counter' component={Counter} />
  </Switch>
)

export default Routes
```  

Or, by using dynamic module imports to provide code-splitting

```js
// routes.js
import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Loadable from 'react-loadable'

const CounterRoute = Loadable({
  loader: () => import('modules/counter'),
  loading: () => <div>loading..</div>
})

const Routes = () => (
  <Switch>
    {/* ... other routes ... */}
    <Route path='/counter' component={CounterRoute} />
  </Switch>
)

export default Routes
```  

## Creating the store

The createStore function creates a store with redux-saga middleware included.

```js
// index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from '@ttoohey/react-redux-modules'

const store = createStore()

ReactDOM.render((
  <Provider store={store}>
    <Router>
      <Routes />
    </Router>
  </Provider>
), document.getElementById('root'));
```

Additonal reducers and middleware can be included when the store is being created by passing them to  the createStore function.

```js
const client = new ApolloClient()
const store = createStore({ apollo: client.reducer() }, [ client.middleware() ])
```

## links

Some links I came across while figuring stuff out.

* http://www.datchley.name/scoped-selectors-for-redux-modules/
* https://jaysoo.ca/2016/02/28/organizing-redux-application/
* https://github.com/erikras/ducks-modular-redux
