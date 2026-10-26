const MUTATING_ARRAY_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
])
const MUTATING_OBJECT_METHODS = new Set([
  'assign',
  'defineProperty',
  'defineProperties',
  'setPrototypeOf',
])
const TYPESCRIPT_WRAPPERS = new Set([
  'TSNonNullExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
])

function getPropertyName(memberExpression) {
  if (!memberExpression.computed) {
    return memberExpression.property.name
  }
  if (memberExpression.property.type === 'Literal') {
    return String(memberExpression.property.value)
  }
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow mutating form values that are shared between renders in place',
    },
    schema: [
      {
        type: 'object',
        properties: {
          names: { type: 'array', items: { type: 'string' } },
        },
        required: ['names'],
        additionalProperties: false,
      },
    ],
    messages: {
      mutation:
        '`{{name}}` is shared between renders and must not be mutated in place, create a new object instead (see AGENTS.md).',
    },
  },
  create(context) {
    const names = new Set(context.options[0].names)

    // Returns the shared value that `node` is or belongs to, following the
    // chain of objects being accessed, e.g. `submission` for
    // `submission.entries[0]` or `formSubmissionModel` for
    // `parent.formSubmissionModel`.
    function findSharedValueName(node) {
      if (
        TYPESCRIPT_WRAPPERS.has(node.type) ||
        node.type === 'ChainExpression'
      ) {
        return findSharedValueName(node.expression)
      }
      if (node.type === 'Identifier') {
        return names.has(node.name) ? node.name : undefined
      }
      if (node.type === 'MemberExpression') {
        const propertyName = getPropertyName(node)
        if (!node.computed && names.has(propertyName)) {
          return propertyName
        }
        return findSharedValueName(node.object)
      }
    }

    function check(node, objectBeingWritten) {
      const name = findSharedValueName(objectBeingWritten)
      if (name) {
        context.report({ node, messageId: 'mutation', data: { name } })
      }
    }

    function checkMemberWrite(node, target) {
      if (target.type === 'MemberExpression') {
        check(node, target.object)
      }
    }

    return {
      AssignmentExpression(node) {
        checkMemberWrite(node, node.left)
      },
      UpdateExpression(node) {
        checkMemberWrite(node, node.argument)
      },
      UnaryExpression(node) {
        if (node.operator === 'delete') {
          checkMemberWrite(node, node.argument)
        }
      },
      CallExpression(node) {
        const callee = node.callee
        if (callee.type !== 'MemberExpression') {
          return
        }
        const methodName = getPropertyName(callee)
        if (MUTATING_ARRAY_METHODS.has(methodName)) {
          check(node, callee.object)
        } else if (
          MUTATING_OBJECT_METHODS.has(methodName) &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Object' &&
          node.arguments[0]
        ) {
          check(node, node.arguments[0])
        }
      },
    }
  },
}
