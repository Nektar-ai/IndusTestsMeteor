import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { mockMethodCall } from 'meteor/quave:testing';
import { assert } from 'chai';
import { TasksCollection } from '/imports/db/TasksCollection';
import '/imports/api/tasksMethods';

if (Meteor.isServer) {
  describe('Tasks', () => {
    describe('methods', () => {
      const userId = Random.id();
      const userIdTwo = userId + 967;
      let taskId;

      beforeEach(() => {
        TasksCollection.remove({});
        taskId = TasksCollection.insert({
          text: 'Test Task',
          createdAt: new Date(),
          userId,
        });
      });

      it('can delete owned task', () => {
        mockMethodCall('tasks.remove', taskId, { context: { userId } });

        assert.equal(TasksCollection.find().count(), 0);
      });

      it(`can't delete task without an user authenticated`, () => {
        const fn = () => mockMethodCall('tasks.remove', taskId);
        assert.throw(fn, /Not authorized/);
        assert.equal(TasksCollection.find().count(), 1);
      });

      it(`can't delete task from another owner`, () => {
        const fn = () =>
          mockMethodCall('tasks.remove', taskId, {
            context: { userId: 'somebody-else-id' },
          });
        assert.throw(fn, /Access denied/);
        assert.equal(TasksCollection.find().count(), 1);
      });

      it('can change the status of a task', () => {
        const originalTask = TasksCollection.findOne(taskId);
        mockMethodCall('tasks.setIsChecked', taskId, !originalTask.isChecked, {
          context: { userId },
        });

        const updatedTask = TasksCollection.findOne(taskId);
        assert.notEqual(updatedTask.isChecked, originalTask.isChecked);
      });

      it('can insert new tasks', () => {
        const text = 'New Task';
        mockMethodCall('tasks.insert', text, {
          context: { userId },
        });

        const tasks = TasksCollection.find({}).fetch();
        assert.equal(tasks.length, 2);
        assert.isTrue(tasks.some(task => task.text === text));
      });

      it("can't insert task without user content", () => {
        const text = 'New Task';
        const fn = () => mockMethodCall('tasks.insert', text);
        assert.throw(fn, /Not authorized/);
        assert.equal(TasksCollection.find().count(), 1);
      });

      it("can remove all task", () => {
        mockMethodCall('tasks.insert', 'coucou', {
          context: { userId },
        })

        assert.equal(TasksCollection.find().count(), 2);
        mockMethodCall('tasks.removeAll', { context: { userId } });

        assert.equal(TasksCollection.find().count(), 0);
      });

      it("can't remove all task without user content", () => {
        const fn = () =>
          mockMethodCall('tasks.removeAll');
        assert.throw(fn, /Not authorized/);
        assert.equal(TasksCollection.find().count(), 1);
      });

      it(`can remove all owned tasks`, () => {

      TasksCollection.insert({
        text: 'Test Task 2',
        createdAt: new Date(),
        userId,
      });

      TasksCollection.insert({
        text: 'Test Task 3',
        createdAt: new Date(),
        userId,
      });

      TasksCollection.insert({
        text: 'Test Task 4',
        createdAt: new Date(),
        userIdTwo,
      });

      assert.equal(TasksCollection.find().count(), 4);

      mockMethodCall('tasks.removeAll', { context: { userId } });

      assert.equal(TasksCollection.find().count(), 1);

    });
  });
})}