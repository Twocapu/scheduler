const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
const koPath = path.join(__dirname, 'src', 'locales', 'ko', 'translation.json');
const enPath = path.join(__dirname, 'src', 'locales', 'en', 'translation.json');

// --- Replace in App.jsx ---
let appContent = fs.readFileSync(appPath, 'utf8');

// Replace state variables
appContent = appContent.replace(/const \[tasks, setTasks\]/g, 'const [routines, setRoutines]');
appContent = appContent.replace(/const \[newTaskName, setNewTaskName\]/g, 'const [newRoutineName, setNewRoutineName]');
appContent = appContent.replace(/const \[newTaskType, setNewTaskType\]/g, 'const [newRoutineType, setNewRoutineType]');
appContent = appContent.replace(/const \[newTaskTarget, setNewTaskTarget\]/g, 'const [newRoutineTarget, setNewRoutineTarget]');

// Replace function names
appContent = appContent.replace(/fetchTasks/g, 'fetchRoutines');
appContent = appContent.replace(/toggleTask/g, 'toggleRoutine');
appContent = appContent.replace(/addTask/g, 'addRoutine');
appContent = appContent.replace(/editTask/g, 'editRoutine');
appContent = appContent.replace(/deleteTask/g, 'deleteRoutine');
appContent = appContent.replace(/resetAllTasks/g, 'resetAllRoutines');

// Variables
appContent = appContent.replace(/tasks\.map/g, 'routines.map');
appContent = appContent.replace(/tasks\.find/g, 'routines.find');
appContent = appContent.replace(/tasks\.filter/g, 'routines.filter');
appContent = appContent.replace(/tasks\.length/g, 'routines.length');
appContent = appContent.replace(/\btasks\b/g, 'routines'); // careful here! we replaced functions
appContent = appContent.replace(/task\./g, 'routine.');
appContent = appContent.replace(/\btask\b(?!s)/gi, 'routine');

// Since we did regex with case insensitive, revert a few things if any, but since we had newTaskName, it became newRoutineName, wait `task` -> `routine`.
// Let's replace the variables manually to be safe.
appContent = appContent.replace(/newTask/g, 'newRoutine');
appContent = appContent.replace(/activeTasks/g, 'activeRoutines');
appContent = appContent.replace(/completedTasks/g, 'completedRoutines');
appContent = appContent.replace(/updatePromises = routines.map/g, 'updatePromises = routines.map'); // already routines

// DB Queries
appContent = appContent.replace(/\.from\('todos'\)/g, `.from('routines')`);

// Translations 
appContent = appContent.replace(/t\('tasks\./g, `t('routines.`);
appContent = appContent.replace(/t\('form\.taskName'\)/g, `t('form.routineName')`);

// Fix some specific strings based on earlier state
appContent = appContent.replace(/const routine = routines.find/g, 'const routine = routines.find');
appContent = appContent.replace(/setRoutines\(\[...routines, data\[0\]\]\)/g, 'setRoutines([...routines, data[0]])');

fs.writeFileSync(appPath, appContent);

// --- Replace in ko ---
let koContent = fs.readFileSync(koPath, 'utf8');
const koObj = JSON.parse(koContent);

koObj.header.manageTasks = '루틴 관리';
if (koObj.tasks) {
  koObj.routines = koObj.tasks;
  delete koObj.tasks;
}
koObj.routines.allCompleted = "모든 루틴을 완료했습니다!";
koObj.routines.emptyList = "목록이 비어있습니다. 설정 아이콘을 눌러 추가해보세요!";
koObj.routines.noTasks = "루틴이 없습니다. 위에서 새로 만들어보세요!";
koObj.routines.pleaseLogin = "루틴을 추가하려면 먼저 로그인해주세요.";
koObj.routines.pleaseEnterName = "루틴 이름을 입력해주세요.";
koObj.routines.errorAdding = "루틴 추가 중 오류 발생: ";
koObj.routines.enterNewName = "새 루틴 이름을 입력하세요:";
koObj.routines.confirmDelete = "이 루틴을 정말 삭제하시겠습니까?";
koObj.routines.resetAll = "모든 루틴 리셋";

koObj.form.addNewTask = "새 루틴 추가";
koObj.form.taskName = "루틴 이름";
koObj.form.addTaskButton = "루틴 추가";

fs.writeFileSync(koPath, JSON.stringify(koObj, null, 2) + '\n');

// --- Replace in en ---
let enContent = fs.readFileSync(enPath, 'utf8');
const enObj = JSON.parse(enContent);

enObj.header.manageTasks = 'Manage Routines';
if (enObj.tasks) {
  enObj.routines = enObj.tasks;
  delete enObj.tasks;
}
enObj.routines.allCompleted = "All Routines Completed!";
enObj.routines.emptyList = "Your list is empty. Click the settings icon to add routines!";
enObj.routines.noTasks = "No routines found. Create one above!";
enObj.routines.pleaseLogin = "Please login first to add routines.";
enObj.routines.pleaseEnterName = "Please enter a routine name.";
enObj.routines.errorAdding = "Error adding routine: ";
enObj.routines.enterNewName = "Enter new routine name:";
enObj.routines.confirmDelete = "Are you sure you want to delete this routine?";
enObj.routines.resetAll = "Reset all routines";

enObj.form.addNewTask = "Add New Routine";
enObj.form.taskName = "Routine Name";
enObj.form.addTaskButton = "Add Routine";

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2) + '\n');

console.log('Done replacement');
