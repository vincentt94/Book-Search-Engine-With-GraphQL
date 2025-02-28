import { AuthenticationError } from '../utils/auth.js';
import User from '../models/User.js';
import { signToken } from '../services-delete/auth.js';


const resolvers = {
  Query: {
    // Fetch a single user by ID or username
    getSingleUser: async (_parent: any, { id, username }: { id?: string; username?: string }) => {
      const user = await User.findOne({
        $or: [{ _id: id }, { username }],
      });

      if (!user) {
        throw new AuthenticationError('Cannot find a user with this id or username!');
      }

      return user;
    },
  },

  Mutation: {
    // Create a user and return a token
    addUser: async (_parent: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new Error('Something went wrong!');
      }

      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    // Login a user and return a token
    login: async (_parent: any, { username, email, password }: { username?: string; email?: string; password: string }) => {
      const user = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Wrong password!');
      }

      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    // Save a book to a user's savedBooks field
    saveBook: async (_parent: any, { book }: { book: any }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error('Error saving book');
      }
    },

    // Remove a book from savedBooks
    removeBook: async (_parent: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};

export default resolvers;
