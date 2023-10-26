import { ScheduledTasksTypes } from '@oneblink/types'
import * as React from 'react'

export const TaskContext = React.createContext<{
  task: ScheduledTasksTypes.Task | undefined
  taskGroup: ScheduledTasksTypes.TaskGroup | undefined
  taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance | undefined
}>({
  task: undefined,
  taskGroup: undefined,
  taskGroupInstance: undefined,
})

export default function useTaskContext() {
  return React.useContext(TaskContext)
}
