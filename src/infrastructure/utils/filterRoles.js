const filterRoles = async (arr, id) => {
    return arr.filter(service => service.code.split('_')[0] === id)
}



module.exports = filterRoles;