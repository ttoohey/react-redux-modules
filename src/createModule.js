import React from 'react'
import PropTypes from 'prop-types'

function globalizeActions(path, actions) {
  return Object.entries(actions).reduce((actions, [key, action]) => {
    actions[key] = (...args) => {
      const a = action(...args)
      return { ...a, type: `${path}/${a.type}`
      }
    }
    return actions
  }, {})
}

function globalizeSelectors(path, selectors) {
  return Object.entries(selectors).reduce((selectors, [key, selector]) => {
    selectors[key] = (state, ...args) => selector(state[path], ...args)
    return selectors
  }, {})
}

function globalizeTypes(path, types) {
  return Object.entries(types).reduce((types, [key, type]) => {
    types[key] = `${path}/${type}`
    return types
  }, {})
}

function globalizeReducer(path, reducer) {
  return (state, action) => {
    if (action.type.substr(0, path.length) === path) {
      return reducer(state, { ...action, type: action.type.substr(path.length+1) })
    }
    return reducer(state, action)
  }
}

function createContainer(module) {
  return Container => class extends React.Component {
    static contextTypes = {
      store: PropTypes.object.isRequired
    }
    constructor (props, context) {
      super()
      module.reducer && context.store.injectReducer(module.path, module.reducer)
      module.saga && context.store.injectSaga(module.path, module.saga)
    }
    render () {
      return <Container {...this.props} />
    }
  }
}

const createModule = (path, duck, Container) => {
  const module = {}
  module.path = path
  module.withReducer = reducer => { module.reducer = globalizeReducer(path, reducer);  return module }
  module.withSaga = saga => { module.saga = saga; return module }
  module.actions = () => globalizeActions(path, duck.actions)
  module.selectors = () => globalizeSelectors(path, duck.selectors)
  module.types = () => globalizeTypes(path, duck.types)
  module.container = () => createContainer(module)(Container)
  return module
}

export default createModule
