/* global confirm */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { TAPi18n } from 'meteor/tap:i18n';

import './lists-show.html';

// Component used in the template
import './todos-item.js';

import { makePrivate, makePublic, remove, updateName } from '../../api/lists/methods.js';

import { insert } from '../../api/todos/methods.js';

import { displayError } from '../lib/errors.js';
import { currentLocalDate } from '../../api/alarm/time';

Template.Lists_show.onCreated(function listShowOnCreated() {
  this.autorun(() => {
    new SimpleSchema({
      list: { type: Function },
      todosReady: { type: Boolean },
      todos: { type: Mongo.Cursor },
    }).validate(Template.currentData());
  });

  this.state = new ReactiveDict();
  this.state.setDefault({
    editing: false,
    editingTodo: false,
  });

  this.saveList = () => {
    this.state.set('editing', false);

    const newName = this.$('[name=name]')
      .val()
      .trim();
    if (newName) {
      updateName.call({
        listId: this.data.list()._id,
        newName,
      }, displayError);
    }
  };

  this.editList = () => {
    this.state.set('editing', true);

    // force the template to redraw based on the reactive change
    Tracker.flush();
    // We need to wait for the fade in animation to complete to reliably focus the input
    Meteor.setTimeout(() => {
      this.$('.js-edit-form input[type=text]')
        .focus();
    }, 400);
  };

  this.deleteList = () => {
    const list = this.data.list();
    // eslint-disable-next-line new-cap
    const message = `${TAPi18n.Todos_item__('lists.remove.confirm')} "${list.name}"?`;

    if (confirm(message)) { // eslint-disable-line no-alert
      remove.call({
        listId: list._id,
      }, displayError);

      FlowRouter.go('App.home');
      return true;
    }

    return false;
  };

  this.toggleListPrivacy = () => {
    const list = this.data.list();
    if (list.userId) {
      makePublic.call({ listId: list._id }, displayError);
    } else {
      makePrivate.call({ listId: list._id }, displayError);
    }
  };
});

Template.Lists_show.helpers({
  todoArgs(todo) {
    const instance = Template.instance();
    return {
      todo,
      editing: instance.state.equals('editingTodo', todo._id),
      onEditingChange(editing) {
        instance.state.set('editingTodo', editing ? todo._id : false);
      },
    };
  },
  editing() {
    const instance = Template.instance();
    return instance.state.get('editing');
  },
  currentLocalDate,
});

Template.Lists_show.events({
  'click .js-cancel'(event, instance) {
    instance.state.set('editing', false);
  },

  'keydown input[type=text]'(event) {
    // ESC
    if (event.which === 27) {
      event.preventDefault();
      $(event.target)
        .blur();
    }
  },

  'blur input[type=text]'(event, instance) {
    // if we are still editing (we haven't just clicked the cancel button)
    if (instance.state.get('editing')) {
      instance.saveList();
    }
  },

  'submit .js-edit-form'(event, instance) {
    event.preventDefault();
    instance.saveList();
  },

  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-cancel, click .js-cancel'(event, instance) {
    event.preventDefault();
    instance.state.set('editing', false);
  },

  // This is for the mobile dropdown
  'change .list-edit'(event, instance) {
    const target = event.target;
    if ($(target)
      .val() === 'edit') {
      instance.editList();
    } else if ($(target)
      .val() === 'delete') {
      instance.deleteList();
    } else {
      instance.toggleListPrivacy();
    }

    target.selectedIndex = 0;
  },

  'click .js-edit-list'(event, instance) {
    instance.editList();
  },

  'click .js-toggle-list-privacy'(event, instance) {
    instance.toggleListPrivacy();
  },

  'click .js-delete-list'(event, instance) {
    instance.deleteList();
  },

  'click .js-todo-add'(event, instance) {
    instance.$('.js-todo-new input')
      .focus();
  },

  'submit .js-todo-new'(event) {
    event.preventDefault();

    const $inputText = $(event.target)
      .find('[type=text]');
    const $inputDate = $(event.target)
      .find('[type=date]');
    const $inputTime = $(event.target)
      .find('[type=time]');
    if (!$inputText.val() || !$inputDate.val() || !$inputTime.val()) {
      return;
    }
    // eslint-disable-next-line max-len
    let completeDate = new Date().toISOString();
    completeDate = completeDate.slice(0, 0) +
      $inputDate.val() + completeDate.slice(0 +
        Math.abs(10));
    completeDate = completeDate.slice(0, 11) +
      $inputTime.val() + completeDate.slice(11 +
        Math.abs(12));
    completeDate = new Date(completeDate);
    insert.call({
      listId: this.list()._id,
      text: $inputText.val(),
      dueDate: completeDate,
    }, displayError);
  },
});
