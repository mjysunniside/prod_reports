const {fetchSunpower, verifyToken} = require('../sunpower/sunpowerMain')

const main = async () => {
    // const tokenValid = await verifyToken()
    // if(!tokenValid) {
    //     console.log("Invalid token!!!")
    //     return
    // }
    const client = {
        id: "2515235000021133020",
        name: "April Grimm",
        monitoring: "A_263679",
        pto: "2020-06-08",
        production: [4797, 3868, 3733]
    }
    const client2 = {
        id: "2515235000039264015",
        name: "Stan Neugebauer",
        monitoring: "A_317390",
        pto: "2021-06-10",
        production: [5443, 8776]
    }
    const client3 = {
        id: "2515235000037200011",
        name: "Janet Gentry",
        monitoring: "A_264800",
        pto: "2021-08-12",
        production: [19297, 18448]
    }
    const res = await fetchSunpower(client2.monitoring, "2021-07-01", "2022-07-01")
    console.log(res)
}


main()