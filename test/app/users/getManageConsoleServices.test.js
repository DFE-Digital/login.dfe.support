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
        });

        getAllServices.mockReset();
        getAllServices.mockReturnValue([
            {
                id: 'service1Id',
                name: 'Service 1',
                description:
                'Service for testing puposes',
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
        expect(sendResult.mock.calls[0][3].user).toMatchObject({
        id: 'user1',
        });
    });
    
    it('should call getAllServices', async () => {
        await getManageConsoleServices(req, res);

        const getAllServicesResult = getAllServices()
        
        expect(getAllServices).toHaveBeenCalled();
        expect(getAllServices).toReturnWith([
        {
            id: 'service1Id',
            name: 'Service 1',
            description:
            'Service for testing puposes',
            isExternalService: true,
            isIdOnlyService: false,
            isHiddenService: false,
            isMigrated: false,
            relyingParty: {},
        }
        ]);
        expect(getAllServicesResult).toHaveLength(1);
        expect(getAllServicesResult[0].id).toBe('service1Id');
    });

    it('should call sendResult', async () => {
        await getManageConsoleServices(req, res);

        expect(sendResult).toHaveBeenCalled();
        expect(sendResult.mock.calls[0][3].user).toMatchObject({
            id: 'user1',
            });
        expect (sendResult.mock.calls[0][3].services).toContainEqual({
            id: 'service1Id',
            name: 'Service 1',
            description:
            'Service for testing puposes',
            isExternalService: true,
            isIdOnlyService: false,
            isHiddenService: false,
            isMigrated: false,
            relyingParty: {},
        })
    })
});
  
  