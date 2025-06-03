import './openAbout.css'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import InclusiveImage from '../../assets/inclusivityImage.png'
import GamifiedLearningImage from '../../assets/gamifiedLearningImage.png'
import Navbar from '../navbar/navbar.jsx';


const openAbout = () => {
    return (
        <div className="about-page-whole">
            <Navbar />
            <div className="aboutSection-wrapper">
                {/* Talking about bringing students together, inclusivity goal */}
                <Card className="border-0 openAbout-card">
                    <Row className="g-0 align-items-center">
                        <Col md={6}>
                        <Card.Body className="py-0 px-5">
                            <Card.Title className="fs-2 fw-bold">Learning For Everyone</Card.Title>
                            <Card.Text className="fs-4">
                                <p>School can be stressful for students, especially those who may find the traditional ways of reading and writing a little difficult.</p>
                                <p>We have created this platform with exactly that in mind.
                                EmbraceEd helps to make learning concepts easier to understand and more welcoming for everyone.</p>
                                We want students to feel included and confident in the classroom whilst hitting their educational goals!
                            </Card.Text>
                        </Card.Body>
                        </Col>
                        <Col md={6}>
                        <div className="image-wrapper">
                            <img src={InclusiveImage} alt="image of students around a classroom table" className="img-fluid rounded openAbout-image" />
                        </div>
                        </Col>
                    </Row>
                </Card>

                {/* Talking about gamified learning and how students can use it  */}
                <Card className="border-0 gameLearning-card">
                    <Row className="g-0 align-items-center">
                        <Col md={6}>
                        <Card.Body className="py-0 px-5">
                            <Card.Title className="fs-2 fw-bold">Empower Learning With Games</Card.Title>
                            <Card.Text className="fs-4">
                                <p>Learning does not have to feel like a chore.</p>
                                <p>Engage with the various games to help you remember and understand lessons better.</p>
                            </Card.Text>
                        </Card.Body>
                        </Col>
                        <Col md={6}>
                        <div className="image-wrapper">
                            <img src={GamifiedLearningImage} alt="image of students around a classroom table" className="img-fluid rounded gameLearning-image" />
                        </div>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    )
}

export default openAbout
