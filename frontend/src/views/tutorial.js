import React, { Component } from "react";
import {TopBar} from "../components/header/topBar";
import {FormattedMessage} from "react-intl";
import messages from "./messages";

const Videos = [
    {
        message: 'learnSignUp',
        youTubeId: 'wqQdDgjBOvY',
    },
    {
        message: 'learnMapBuildings',
        youTubeId: 'nswUcgMfKTM',
    },
    {
        message: 'learnMapRoads',
        youTubeId: 'NzZWur1YG1k',
    },
];

const QuizData = [{
    question: "Which of the followings is not required for signing up on Task Manager?",
    options: [{id: 1, text: "Name"}, {id: 2, text: "Email Address"}, {id: 3, text: "Password"},
        {id: 4, text: "Driver License Number"}],
    answer: 4,
    message: "You need a valid name, email address, and password in order to sign up on Task Manager."
}, {
    question: "After signing up, which icon to click if you want to start contributing?",
    options: [{id: 1, text: "Explore Projects"}, {id: 2, text: "My Contributions"},
        {id: 3, text: "Learn"}, {id: 4, text: "About"}],
    answer: 1,
    message: "Clicking on 'Explore Projects' will direct you to the projects awaiting contribution."
},{
    question: "What kind of information is not provided for each project?",
    options: [{id: 1, text: "Priority level"}, {id: 2, text: "Project number"},
        {id: 3, text: "Difficulty level"}, {id: 4, text: "Completion level"}, {id: 5, text: "None of the above"}],
    answer: 5,
    message: "Priority level, Project number, Difficulty level, and Completion level are all provided and visable" +
        "for all projects"
},{
    question: "True or False: You should always work inside the bright pink boundary when contributing.",
    options: [{id: 1, text: "True"}, {id: 2, text: "False"}],
    answer: 1,
    message: "You should always work inside the bright pink boundary when contributing."
},{
    question: "True or False: You cannot choose if someone else can review your edits.",
    options: [{id: 1, text: "True"}, {id: 2, text: "False"}],
    answer: 2,
    message: "You decide if someone else can review your edits when you commit your changes."
},{
    question: "If a road crosses another, how should you make sure they intersect?",
    options: [{id: 1, text: "Click on the road it crosses"}, {id: 2, text: "Double click the map"},
        {id: 3, text: "Close the webpage"}, {id: 4, text: "Nothing needs to be done"}],
    answer: 1,
    message: "If a road crosses another, you should click on the road it crosses wo ensure they intersect."
},{
    question: "If you don't know how to tag a road, which website should you check?",
    options: [{id: 1, text: "tasks.hotosm.org"}, {id: 2, text: "wiki.openstreetmap.org"},
        {id: 3, text: "petfinder.com"}, {id: 4, text: "store.steampowered.com"}],
    answer: 2,
    message: "wiki.openstreetmap.org provides useful information about how to tag different roads."
}

]

export class TutorialPage extends Component {
    constructor(props) {
        super(props)

        this.state = {
            question: null,
            options: [],
            answer: null,
            message: null,
            userAnswer: null,
            currentIndex: 0,
            quizEnd: false,
            disabled: true,
            videoMode: true,
            currentVideoIndex: 0
        }
    }

    loadQuiz = () => {
        const { currentIndex}  = this.state;
        this.setState(() => {
            return {
                question: QuizData[currentIndex].question,
                options: QuizData[currentIndex].options,
                answer: QuizData[currentIndex].answer,
                message: QuizData[currentIndex].message
            }
        })
    }

    nextQuestionHandler = () => {
        const { videoMode, currentIndex } = this.state
        if (videoMode === true) {
            this.setState({
                currentVideoIndex: this.state.currentVideoIndex + 1,
                disabled: true,
                videoMode: false
            })
        } else {
            if (currentIndex === 1 || currentIndex === 4) {
                this.setState({
                    currentIndex: this.state.currentIndex + 1,
                    disabled: true,
                    videoMode: true
                })
            } else {
                this.setState({
                    currentIndex: this.state.currentIndex + 1,
                    disabled: true,
                })
            }

        }
    }

    reviewHandler = () => {
        this.setState({
            currentVideoIndex: this.state.currentVideoIndex - 1,
            disabled: true,
            videoMode: true
        })
    }

    finishHandler = () => {
        if(this.state.currentIndex === QuizData.length -1){
            this.setState({
                quizEnd: true
            })
        }
    }

    //Check the answer
    checkAnswer = userAnswer => {
        const { answer } = this.state
        if (userAnswer === answer) {
            this.setState({
                userAnswer: userAnswer,
                optionColor: "green",
                disabled: false
            })
        } else {
            this.setState({
                userAnswer: userAnswer,
                optionColor: "orange",
                disabled: false
            })
        }
    }

    componentDidMount() {
        this.loadQuiz()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { currentIndex } = this.state
        if (this.state.currentIndex !== prevState.currentIndex) {
            this.setState(() => {
                return {
                    question: QuizData[currentIndex].question,
                    options: QuizData[currentIndex].options,
                    answer: QuizData[currentIndex].answer,
                    message: QuizData[currentIndex].message
                }
            })
        }
    }

    render() {
        const {
            question, options, currentIndex, answer, message,
            quizEnd, disabled, videoMode, currentVideoIndex} = this.state

        if (videoMode) {
            const iframeStyle = {
                border: 0,
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
            };

            return (
                <div className="pt180 pull-center blue-dark">
                    <TopBar pageName={<FormattedMessage {...messages.tutorial} />} />
                    <div className="tc overflow-hidden relative" style={{ paddingTop: '56.25%' }}>
                        <iframe
                            title="videotutorial"
                            style={iframeStyle}
                            src={`https://www.youtube.com/embed/${Videos[currentVideoIndex].youTubeId}?autoplay=1`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen="allowFullScreen"
                        ></iframe>
                    </div>
                    <button className="bg-red white mh2 mv3 dib f3 fr-ns"
                            onClick = {this.nextQuestionHandler}>
                        Continue
                    </button>
                </div>
            )
        }

        if(quizEnd) {
            return (
                <div className="pt180 pull-center blue-dark">
                    <TopBar pageName={<FormattedMessage {...messages.tutorial} />} />
                    <div className="ph6-l ph4-m ph2">
                        <h1>Congratulations! You have successfully finished the tutorial.</h1>
                    </div>
                </div>
            )
        }

        return (
            <div className="pt180 pull-center blue-dark">
                <TopBar pageName={<FormattedMessage {...messages.tutorial} />} />
                <quizOptions/>
                <div style={ {padding: "5%"} }>
                    <h2>{question}</h2>
                    <span>{`Question ${currentIndex + 1} of ${QuizData.length}`}</span>
                    {options.map(option => {
                        if (disabled === true) {
                            return (  //for each option, new paragraph
                                <p style={{
                                    lineHeight: "150%", lineBreak: "120%",
                                    border: `2px solid gray`
                                }}
                                   key={option.id}
                                   onClick={() => this.checkAnswer(option.id)}

                                >
                                    {option.text}
                                </p>
                            )
                        } else if (answer === option.id) {
                            return (  //for each option, new paragraph
                                <p style={{
                                    lineHeight: "150%", lineBreak: "120%",
                                    border: `2px solid green`
                                }}
                                   key={option.id}
                                   onClick={() => this.checkAnswer(option.id)}

                                >
                                    {option.text}
                                </p>
                            )
                        } else {
                            return (  //for each option, new paragraph
                                <p style={{
                                    lineHeight: "150%", lineBreak: "120%",
                                    border: `2px solid red`
                                }}
                                   key={option.id}
                                   onClick={() => this.checkAnswer(option.id)}

                                >
                                    {option.text}
                                </p>
                            )
                        }
                    })}
                    <p style={{visibility: `${disabled ? "hidden" : "visible"}`}}>
                        {message}
                    </p>
                    {currentIndex < QuizData.length -1 &&
                    <button
                        className="bg-dark-gray white mh2 mv3 dib f3 fr-ns"
                        hidden = {this.state.disabled}
                        onClick = {this.nextQuestionHandler}
                    >Next Question</button>
                    }
                    {currentIndex === QuizData.length -1 &&
                    <button
                        className="bg-dark-grey white mh2 mv3 dib f3 fr-ns"
                        disabled = {this.state.disabled}
                        onClick = {this.finishHandler}
                    >Finish</button>
                    }
                    <button className="bg-red white mh2 mv3 dib f3 fr-ns"
                            onClick = {this.reviewHandler}>
                        Review Video
                    </button>
                </div>
            </div>

        )
    }
}

export default TutorialPage