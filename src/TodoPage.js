import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Row, Col, Card, Button, Input, List, Checkbox, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { Input as AntdInput } from 'antd';
import { useRef } from 'react';
import { Pagination } from 'antd';

// 工具函数：获取本周一
function getMonday(date) {
  return dayjs(date).startOf('week').add(1, 'day').format('YYYY-MM-DD');
}

// 工具函数：获取上周一
function getLastMonday(date) {
  return dayjs(date).startOf('week').add(1, 'day').subtract(1, 'week').format('YYYY-MM-DD');
}

// 深拷贝工具
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const STORAGE_KEY = 'todo_data_v2';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 1. 判断主任务完成状态
function isTaskDone(task) {
  return task.subtasks && task.subtasks.length > 0 && task.subtasks.every(st => st.done);
}

export default function TodoPage() {
  // 数据结构：{ weekTodos: { [monday]: [todo] }, todos: { [date]: [todo] }, history: { [monday]: { weekTodos, todos } } }
  const [data, setData] = useState(loadData());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [inputWeek, setInputWeek] = useState('');
  const [inputDay, setInputDay] = useState('');
  const [editModal, setEditModal] = useState({ visible: false, type: '', week: '', date: '', todo: null });

  // 新增子任务编辑逻辑
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const subtaskIdRef = useRef(0);

  // 打开编辑弹窗时初始化子任务和标题
  useEffect(() => {
    if (editModal.visible && editModal.todo) {
      setEditTitle(editModal.todo.title || '');
      setSubtasks(editModal.todo.subtasks || []);
    }
  }, [editModal]);

  // 编辑弹窗添加子任务
  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { id: Date.now() + (subtaskIdRef.current++), title: subtaskInput.trim(), done: false }]);
    setSubtaskInput('');
  };
  const toggleSubtaskDone = (id) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, done: !st.done } : st));
  };
  const deleteSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };
  const editSubtaskTitle = (id, title) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, title } : st));
  };

  // 自动归档：每周一自动将上周内容归档到history，并清空本周内容
  useEffect(() => {
    const todayMonday = getMonday(dayjs());
    if (!data.weekTodos) data.weekTodos = {};
    if (!data.todos) data.todos = {};
    if (!data.history) data.history = {};
    if (!data.weekTodos[todayMonday]) {
      // 归档上周
      const lastMonday = getLastMonday(dayjs());
      if (data.weekTodos[lastMonday] || Object.keys(data.todos).some(d => getMonday(d) === lastMonday)) {
        data.history[lastMonday] = {
          weekTodos: data.weekTodos[lastMonday] || [],
          todos: Object.fromEntries(Object.entries(data.todos).filter(([d]) => getMonday(d) === lastMonday)),
        };
      }
      // 清空本周
      data.weekTodos[todayMonday] = [];
      Object.keys(data.todos).forEach(d => { if (getMonday(d) === todayMonday) delete data.todos[d]; });
      setData(deepClone({ ...data }));
      saveData(data);
    }
    // eslint-disable-next-line
  }, []);

  // 持久化
  useEffect(() => { saveData(data); }, [data]);

  // 周待办操作
  const addWeekTodo = () => {
    const monday = getMonday(selectedDate);
    if (!inputWeek.trim()) return;
    const todo = { id: Date.now(), title: inputWeek.trim(), done: false, usedInDays: [], subtasks: [] };
    data.weekTodos[monday] = data.weekTodos[monday] || [];
    data.weekTodos[monday].push(todo);
    setData(deepClone({ ...data }));
    setInputWeek('');
  };
  const toggleWeekDone = (id) => {
    const monday = getMonday(selectedDate);
    const todo = data.weekTodos[monday].find(t => t.id === id);
    todo.done = !todo.done;
    setData(deepClone({ ...data }));
  };
  const deleteWeekTodo = (id) => {
    const monday = getMonday(selectedDate);
    data.weekTodos[monday] = data.weekTodos[monday].filter(t => t.id !== id);
    setData(deepClone({ ...data }));
  };
  const editWeekTodo = (todo) => {
    setEditModal({ visible: true, type: 'week', week: getMonday(selectedDate), todo });
  };
  const copyToDay = (todo) => {
    const date = selectedDate.format('YYYY-MM-DD');
    data.todos[date] = data.todos[date] || [];
    // 避免重复添加
    if (!data.todos[date].some(t => t.title === todo.title)) {
      data.todos[date].push({ id: Date.now(), title: todo.title, done: false, subtasks: deepClone(todo.subtasks || []) });
      todo.usedInDays = todo.usedInDays || [];
      if (!todo.usedInDays.includes(date)) todo.usedInDays.push(date);
      setData(deepClone({ ...data }));
    } else {
      message.info('该任务已在今日待办中');
    }
  };

  // 日待办操作
  const addDayTodo = () => {
    const date = selectedDate.format('YYYY-MM-DD');
    if (!inputDay.trim()) return;
    const todo = { id: Date.now(), title: inputDay.trim(), done: false, subtasks: [] };
    data.todos[date] = data.todos[date] || [];
    data.todos[date].push(todo);
    setData(deepClone({ ...data }));
    setInputDay('');
  };
  const toggleDayDone = (id) => {
    const date = selectedDate.format('YYYY-MM-DD');
    const todo = data.todos[date].find(t => t.id === id);
    todo.done = !todo.done;
    setData(deepClone({ ...data }));
  };
  const deleteDayTodo = (id) => {
    const date = selectedDate.format('YYYY-MM-DD');
    data.todos[date] = data.todos[date].filter(t => t.id !== id);
    setData(deepClone({ ...data }));
  };
  const editDayTodo = (todo) => {
    setEditModal({ visible: true, type: 'day', date: selectedDate.format('YYYY-MM-DD'), todo });
  };

  // 编辑弹窗
  const handleEditOk = (value) => {
    if (editModal.type === 'week') {
      const arr = data.weekTodos?.[editModal.week] || [];
      const t = arr.find(t => t.id === editModal.todo?.id);
      if (t) {
        t.title = value.title;
        t.subtasks = deepClone(value.subtasks || []);
      }
    } else if (editModal.type === 'day') {
      const arr = data.todos?.[editModal.date] || [];
      const t = arr.find(t => t.id === editModal.todo?.id);
      if (t) {
        t.title = value.title;
        t.subtasks = deepClone(value.subtasks || []);
      }
    }
    setData(deepClone({ ...data }));
    setEditModal({ visible: false });
  };

  // 日历日期渲染
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const list = data.todos?.[dateStr] || [];
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {list.length > 0 && <Badge status="processing" text={list.length + '项'} />}
      </ul>
    );
  };
  const onSelect = (value) => setSelectedDate(value);

  // 历史区
  const historyWeeks = Object.keys(data.history || {}).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
  const [historyPage, setHistoryPage] = useState(1);
  const historyWeeksArr = historyWeeks;
  const pageSize = 1; // 每页展示1周
  const historyWeekSlice = historyWeeksArr.slice((historyPage-1)*pageSize, historyPage*pageSize);

  return (
    <div style={{ position: 'relative', minHeight: '80vh', padding: 24 }}>
      {/* 日历（固定在页面最右侧） */}
      <div style={{ position: 'fixed', top: 80, right: 0, width: 320, background: '#fff', boxShadow: '0 2px 8px #eee', borderRadius: 8, padding: 8, zIndex: 100 }}>
        <Calendar fullscreen={false} value={selectedDate} onSelect={onSelect} dateCellRender={dateCellRender} />
      </div>
      {/* 核心区及历史待办 */}
      <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start', paddingRight: 340 }}>
        {/* 周待办 */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <h2 style={{ textAlign: 'left' }}>待办事项</h2>
          <Input
            placeholder="添加本周待办"
            value={inputWeek}
            onChange={e => setInputWeek(e.target.value)}
            onPressEnter={addWeekTodo}
            suffix={<PlusOutlined onClick={addWeekTodo} />}
            style={{ marginBottom: 12, textAlign: 'left' }}
          />
          <List
            bordered
            dataSource={data.weekTodos?.[getMonday(selectedDate)] || []}
            renderItem={item => {
              const done = isTaskDone(item);
              const total = item.subtasks?.length || 0;
              const finished = item.subtasks?.filter(st => st.done).length || 0;
              return (
                <List.Item
                  style={{ background: item.usedInDays && item.usedInDays.includes(selectedDate.format('YYYY-MM-DD')) ? '#e6f7ff' : undefined, textAlign: 'left', opacity: done ? 0.6 : 1 }}
                  actions={[
                    <Button icon={<CopyOutlined />} size="small" onClick={() => copyToDay(item)} title="添加到今日" />,
                    <Button icon={<EditOutlined />} size="small" onClick={() => editWeekTodo(item)} />,
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => deleteWeekTodo(item.id)} />,
                  ]}
                >
                  {/* 移除主任务勾选框 */}
                  <div style={{ textAlign: 'left', display: 'inline-block', width: '80%' }}>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap', textDecoration: done ? 'line-through' : 'none', color: done ? '#aaa' : undefined }}>{item.title}</div>
                    {/* 子任务完成数/总数 */}
                    {total > 0 && <div style={{ fontSize: 12, color: '#888', margin: '2px 0 4px 0' }}>{`已完成 ${finished}/${total}`}</div>}
                    {item.subtasks && item.subtasks.length > 0 && (
                      <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                        {item.subtasks.map(st => (
                          <li key={st.id} style={{ fontSize: 13, color: st.done ? '#aaa' : '#555', textDecoration: st.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center' }}>
                            <Checkbox checked={st.done} onChange={() => {
                              st.done = !st.done;
                              setData(deepClone({ ...data }));
                            }} style={{ marginRight: 4 }} />
                            {st.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </List.Item>
              );
            }}
            style={{ textAlign: 'left' }}
          />
        </div>
        {/* 日待办 */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <h2 style={{ textAlign: 'left' }}>{selectedDate.format('YYYY年MM月DD日')} 待办</h2>
          <Input
            placeholder="添加今日待办"
            value={inputDay}
            onChange={e => setInputDay(e.target.value)}
            onPressEnter={addDayTodo}
            suffix={<PlusOutlined onClick={addDayTodo} />}
            style={{ marginBottom: 12, textAlign: 'left' }}
          />
          <List
            bordered
            dataSource={data.todos?.[selectedDate.format('YYYY-MM-DD')] || []}
            renderItem={item => (
              <List.Item
                style={{ textAlign: 'left' }}
                actions={[
                  <Button icon={<EditOutlined />} size="small" onClick={() => editDayTodo(item)} />,
                  <Button icon={<DeleteOutlined />} size="small" danger onClick={() => deleteDayTodo(item.id)} />,
                ]}
              >
                <Checkbox checked={item.done} onChange={() => toggleDayDone(item.id)} style={{ marginRight: 8 }} />
                <div style={{ textAlign: 'left', display: 'inline-block', width: '80%' }}>
                  <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{item.title}</div>
                  {item.subtasks && item.subtasks.length > 0 && (
                    <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                      {item.subtasks.map(st => (
                        <li key={st.id} style={{ fontSize: 13, color: st.done ? '#aaa' : '#555', textDecoration: st.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center' }}>
                          <Checkbox checked={st.done} disabled style={{ marginRight: 4 }} />
                          {st.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </List.Item>
            )}
            style={{ textAlign: 'left' }}
          />
        </div>
        {/* 历史待办模块，归属于本周待办下方 */}
        <div style={{ width: '100%', marginTop: 32 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 16 }}>历史待办</div>
          <Row gutter={16} justify="center" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
            {historyWeekSlice.map(week => {
              const weekData = data.history?.[week] || { weekTodos: [], todos: {} };
              return (
                <Col key={week} style={{ minWidth: 400 }}>
                  <Card
                    size="small"
                    title={dayjs(week).format('YYYY/MM/DD') + ' 周'}
                    style={{ minWidth: 380, textAlign: 'center', maxHeight: 260, overflowY: 'auto' }}
                    extra={<Button size="small" type="link" onClick={() => Modal.info({
                      title: dayjs(week).format('YYYY/MM/DD') + ' 周详情',
                      width: 600,
                      content: (
                        <div>
                          <h4>周待办</h4>
                          <List
                            dataSource={weekData.weekTodos.slice(0, 3)}
                            renderItem={item => (
                              <List.Item
                                actions={[
                                  <Button icon={<EditOutlined />} size="small" onClick={() => {
                                    setEditModal({ visible: true, type: 'week', week, todo: item });
                                  }} />,
                                  <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
                                    weekData.weekTodos = weekData.weekTodos.filter(t => t.id !== item.id);
                                    data.history[week].weekTodos = weekData.weekTodos;
                                    setData(deepClone({ ...data }));
                                  }} />,
                                ]}
                              >
                                <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap', textDecoration: isTaskDone(item) ? 'line-through' : 'none', color: isTaskDone(item) ? '#aaa' : undefined }}>{item.title}</div>
                                {item.subtasks && item.subtasks.length > 0 && (
                                  <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                                    {item.subtasks.map(st => (
                                      <li key={st.id} style={{ fontSize: 13, color: st.done ? '#aaa' : '#555', textDecoration: st.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center' }}>
                                        <Checkbox checked={st.done} disabled style={{ marginRight: 4 }} />
                                        {st.title}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </List.Item>
                            )}
                          />
                          <h4>日待办</h4>
                          {Object.entries(weekData.todos || {}).map(([date, todos]) => (
                            <div key={date} style={{ marginBottom: 8 }}>
                              <b>{date}</b>
                              <List
                                dataSource={todos}
                                renderItem={item => (
                                  <List.Item
                                    actions={[
                                      <Button icon={<EditOutlined />} size="small" onClick={() => {
                                        setEditModal({ visible: true, type: 'day', date, todo: item });
                                      }} />,
                                      <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
                                        weekData.todos[date] = weekData.todos[date].filter(t => t.id !== item.id);
                                        data.history[week].todos = weekData.todos;
                                        setData(deepClone({ ...data }));
                                      }} />,
                                    ]}
                                  >
                                    <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{item.title}</div>
                                    {item.subtasks && item.subtasks.length > 0 && (
                                      <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                                        {item.subtasks.map(st => (
                                          <li key={st.id} style={{ fontSize: 13, color: st.done ? '#aaa' : '#555', textDecoration: st.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center' }}>
                                            <Checkbox checked={st.done} disabled style={{ marginRight: 4 }} />
                                            {st.title}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </List.Item>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      ),
                    })}>
                      查看
                    </Button>}
                  >
                    <div>周待办: {weekData.weekTodos.length}</div>
                    <div>日待办: {Object.values(weekData.todos || {}).reduce((a, b) => a + b.length, 0)}</div>
                  </Card>
                </Col>
              );
            })}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Pagination
              current={historyPage}
              pageSize={pageSize}
              total={historyWeeksArr.length}
              onChange={setHistoryPage}
              showSizeChanger={false}
            />
          </div>
        </div>
      </div>
      {/* 编辑弹窗 */}
      <Modal
        open={editModal.visible}
        title="编辑待办"
        onCancel={() => setEditModal({ visible: false })}
        onOk={() => {
          if (!editTitle.trim()) return;
          handleEditOk({ title: editTitle.trim(), subtasks });
        }}
        destroyOnClose
      >
        <AntdInput.TextArea
          id="edit-todo-title"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="请输入待办标题，可多行"
          style={{ marginBottom: 8 }}
        />
        {/* 内容输入框已去除，仅保留标题和子任务 */}
        <div style={{ marginBottom: 8 }}>
          <b>子任务</b>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <AntdInput
              value={subtaskInput}
              onChange={e => setSubtaskInput(e.target.value)}
              onPressEnter={addSubtask}
              placeholder="添加子任务"
              style={{ flex: 1 }}
            />
            <Button onClick={addSubtask} type="primary" size="small">添加</Button>
          </div>
          <List
            size="small"
            dataSource={subtasks}
            renderItem={st => (
              <List.Item
                style={{ padding: '2px 0' }}
                actions={[
                  <Button icon={<DeleteOutlined />} size="small" onClick={() => deleteSubtask(st.id)} />
                ]}
              >
                <Checkbox checked={st.done} onChange={() => toggleSubtaskDone(st.id)} style={{ marginRight: 8 }} />
                <AntdInput
                  value={st.title}
                  onChange={e => editSubtaskTitle(st.id, e.target.value)}
                  size="small"
                  style={{ width: 180 }}
                />
              </List.Item>
            )}
            style={{ marginTop: 4, maxHeight: 120, overflow: 'auto' }}
          />
        </div>
      </Modal>
    </div>
  );
} 