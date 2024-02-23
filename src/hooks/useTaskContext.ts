import { ScheduledTasksTypes } from '@oneblink/types'
import * as React from 'react'

export interface TaskContext {
  task: ScheduledTasksTypes.Task | undefined
  taskGroup: ScheduledTasksTypes.TaskGroup | undefined
  taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance | undefined
}
export const TaskContext = React.createContext<TaskContext>({
  task: undefined,
  taskGroup: undefined,
  taskGroupInstance: undefined,
})

export default function useTaskContext() {
  return React.useContext(TaskContext)
}
