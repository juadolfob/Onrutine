import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import './todos-item.html';
import { Todos } from '../../api/todos/todos.js';

import { remove, setCheckedStatus, updateText, updateDueDate } from '../../api/todos/methods.js';

import { currentLocalDate } from '../../api/alarm/time.js';

import { displayError } from '../lib/errors.js';

Template.Todos_item.onCreated(function todosItemOnCreated() {
  this.autorun(() => {
    new SimpleSchema({
      todo: { type: Todos._helpers },
      editing: { type: Boolean, optional: true },
      onEditingChange: { type: Function },
    }).validate(Template.currentData());
  });
});

Template.Todos_item.helpers({
  checkedClass(todo) {
    return todo.checked && 'checked';
  },
  editingClass(editing) {
    return editing && 'editing';
  },
  currentLocalDate,
  dateformat(dueDate) {
    return dueDate.toISOString().substring(0, 10);
  },
  timeformat(dueDate) {
    return dueDate.toISOString().substring(11, 19);
  },
});

Template.Todos_item.events({
  'change [type=checkbox]'(event) {
    const checked = $(event.target)
      .is(':checked');

    setCheckedStatus.call({
      todoId: this.todo._id,
      newCheckedStatus: checked,
    });
  },

  'focus input[type=text], focus  input[type=date], focus  input[type=time]'() {
    this.onEditingChange(true);
  },
  'blur input[type=text], blur  input[type=date], blur  input[type=time]'() {
    if (this.editing) {
      this.onEditingChange(false);
    }
  },
  'keydown input[type=text], keydown input[type=date], keydown input[type=time]'(event) {
    // ESC or ENTER
    if (event.which === 27 || event.which === 13) {
      event.preventDefault();
      event.target.blur();
    }
  },

  // update the text of the item on keypress but throttle the event to ensure
  // we don't flood the server with updates (handles the event at most once
  // every 300ms)
  'keyup input[type=text]': _.throttle(function todosItemKeyUpInner(event) {
    updateText.call({
      todoId: this.todo._id,
      newText: event.target.value,
    }, displayError);
  }, 300),
  'keyup input[type=date]': _.throttle(function todosItemKeyUpInner(event) {
    let completeDate = this.todo.dueDate.toISOString();
    completeDate = completeDate.slice(0, 0) +
      event.target.value + completeDate.slice(0 +
        Math.abs(10));
    completeDate = new Date(completeDate);
    updateDueDate.call({
      todoId: this.todo._id,
      nextDueDate: completeDate,
    }, displayError);
  }, 300),
  'keyup input[type=time]': _.throttle(function todosItemKeyUpInner(event) {
    let completeDate = this.todo.dueDate.toISOString();
    completeDate = completeDate.slice(0, 11) +
      event.target.value + completeDate.slice(11 +
        Math.abs(12));
    completeDate = new Date(completeDate);
    updateDueDate.call({
      todoId: this.todo._id,
      nextDueDate: completeDate,
    }, displayError);
  }, 300),
  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-delete-item, click .js-delete-item'() {
    remove.call({
      todoId: this.todo._id,
    }, displayError);
  },
});
