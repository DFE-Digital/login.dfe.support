const filterRoles = async (arr, id) => {
    return arr.filter(service => service.code.split('_')[0] === id)
}

// manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)

module.exports = filterRoles;