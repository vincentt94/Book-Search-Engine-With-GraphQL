import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';

import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';

const SavedBooks = () => {
  // Use Apollo's `useQuery` hook to fetch user data
  const { loading, data } = useQuery(GET_ME);
  const userData = data?.me || {};

  // Use Apollo's `useMutation` hook for book deletion
  const [removeBook] = useMutation(REMOVE_BOOK, {
    update(cache, { data: { removeBook } }) {
      // Update the cache manually after deleting a book
      cache.writeQuery({
        query: GET_ME,
        data: { me: removeBook },
      });
    },
  });

  // Function to handle book deletion
  const handleDeleteBook = async (bookId: string) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) return false;

    try {
      await removeBook({
        variables: { bookId },
      });

      // Remove book from local storage
      removeBookId(bookId);
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className="pt-5">
          {userData.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'
            }`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks?.map((book: {
            bookId: string;
            title: string;
            authors: string[];
            description: string;
            image?: string;
          }) => (<Col md="4" key={book.bookId}>
            <Card border="dark">
              {book.image && (
                <Card.Img
                  src={book.image}
                  alt={`The cover for ${book.title}`}
                  variant="top"
                />
              )}
              <Card.Body>
                <Card.Title>{book.title}</Card.Title>
                <p className="small">Authors: {book.authors.join(', ')}</p>
                <Card.Text>{book.description}</Card.Text>
                <Button
                  className="btn-block btn-danger"
                  onClick={() => handleDeleteBook(book.bookId)}
                >
                  Delete this Book!
                </Button>
              </Card.Body>
            </Card>
          </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
