const router = require('express').Router();
const HttpStatus = require('http-status-codes');
const { authGuard, adminGuard } = require('../../middleware');
const QuizResultService = require('./quiz-result.service');

/**
 *  @swagger
 *  paths:
 *    /api/v1/quiz-results/submit:
 *      post:
 *        summary: Submit Quiz
 *        description: Submit an answered Quiz for evaluation
 *        tags:
 *          - QuizResults
 *        operationId: submit
 *        parameters:
 *          - in: body
 *            schema:
 *              type: object
 *              properties:
 *                $ref: '#/components/schemas/QuizResult'
 *        responses:
 *          202:
 *            description: Accepted
 *            content:
 *              apppliaction/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/QuizResult'
 */
router.post('/quiz-results/submit', async (req, res, next) => {
  try {
    const data = await QuizResultService.create(req.body.quiz);
    return res.status(HttpStatus.ACCEPTED).json({ data });
  } catch (e) {
    next(e);
  }
});

/**
 *  @swagger
 *  paths:
 *    /api/v1/quiz-results:
 *      get:
 *        summary: list quiz results
 *        description: Fetch a list of `QuizResults`
 *        tags:
 *          - QuizResults
 *        operationId: list
 *        parameters:
 *          - in: query
 *            schema:
 *              type: object
 *              properties:
 *                $ref: '#/components/schemas/QuizResult'
 *        responses:
 *          200:
 *            description: OK
 *            content:
 *              apppliaction/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/QuizResult'
 */
router.get('/quiz-results', async (req, res, next) => {
  try {
    const data = await QuizResultService.find(req.query);
    return res.status(HttpStatus.OK).json({ data });
  } catch (e) {
    next(e);
  }
});

/**
 *  @swagger
 *  paths:
 *    /api/v1/quiz-results/{id}:
 *      get:
 *        summary: Get quiz result
 *        description: Get a `QuizResult` by id
 *        tags:
 *          - QuizResults
 *        operationId: getById
 *        parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: The id of the QuizResult to fetch
 *        responses:
 *          200:
 *            description: Ok
 *            content:
 *              apppliaction/json:
 *                schema:
 *                  $ref: '#/components/schemas/QuizResult'
 */
router.get('/quiz-results/:id', async (req, res, next) => {
  try {
    const data = await QuizResultService.findById(req.params.id);
    if (!data) { return res.sendStatus(HttpStatus.NOT_FOUND); }
    return res.status(HttpStatus.OK).json({ data });
  } catch (e) {
    next(e);
  }
});

/**
 *  @swagger
 *  paths:
 *    /api/v1/quiz-results/{id}:
 *      delete:
 *        summary: Delete quiz result
 *        description: Fetch a `QuizResult` by id and delete
 *        tags:
 *          - QuizResults
 *        operationId: deleteById
 *        parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: The id of the QuizResult to delete
 *        responses:
 *          204:
 *            description: No Content
 */
router.delete('/quiz-results/:id', authGuard, adminGuard, async (req, res, next) => {
  try {
    await QuizResultService.findByIdAndDelete(req.params.id);
    return res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
