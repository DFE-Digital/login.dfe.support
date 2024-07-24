jest.mock('./../../../src/infrastructure/config', () =>
    require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/app/users/utils');

const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices')

const { sendResult } = require('./../../../src/infrastructure/utils');
const {
getAllServices,
} = require('./../../../src/infrastructure/applications');

const { getUserDetails } = require('./../../../src/app/users/utils');

describe('getManageConsoleServices', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            id: 'correlationId',
            csrfToken: () => 'token',
            accepts: () => ['text/html'],
            user: {
            sub: 'user1',
            email: 'super.user@unit.test',
        },
        params: {
            uid: 'user1',
        },
        session: {},
    };

    res = {
        render: jest.fn(),
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
        id: 'user1',
        name: 'Timmy Tester',
        email: 'super.user@unit.test'
    });

    getAllServices.mockReset();
    getAllServices.mockReturnValue([
    {
        id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
        name: 'Academy Budget Forecast Return',
        description:
        'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
        isExternalService: true,
        isIdOnlyService: false,
        isHiddenService: false,
        isMigrated: false,
        relyingParty: {},
    }
    ]);
});

    it('should call getUserDetails', async () => {
        await getManageConsoleServices(req, res);

        expect(getUserDetails).toHaveBeenCalled()
        expect(getUserDetails).not.toBeFalsy();
        expect(getUserDetails.mock.calls[0]).toHaveLength(1);
    });
    
    it('should call getAllServices', async () => {
        await getManageConsoleServices(req, res);
        
        expect(getAllServices).toHaveBeenCalled();
        expect(getAllServices).toReturnWith([
        {
            id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
            name: 'Academy Budget Forecast Return',
            description:
            'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
            isExternalService: true,
            isIdOnlyService: false,
            isHiddenService: false,
            isMigrated: false,
            relyingParty: {},
        }
        ]);
        expect(getAllServices()).toHaveLength(1);
        expect(getAllServices().length).toBe(1);
        expect(getUserDetails).not.toBeFalsy();
        expect(getAllServices()[0].id).toBe('49FFFA46-BB7A-439A-B7A1-7CA00FF77456');
    });

    it('should call sendResult', async () => {
        await getManageConsoleServices(req, res);

        expect(sendResult).toHaveBeenCalled();
        expect(sendResult.mock.calls[0][3].user).toMatchObject({
            id: 'user1',
            name: 'Timmy Tester',
            email: 'super.user@unit.test'
            });
        expect(sendResult.mock.calls[0][3].services).toContainEqual(
            {
                id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
                name: 'Academy Budget Forecast Return',
                description:
                'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
                isExternalService: true,
                isIdOnlyService: false,
                isHiddenService: false,
                isMigrated: false,
                relyingParty: {},
            }
            );
        
    })
});
  
  