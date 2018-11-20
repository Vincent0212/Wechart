const rp = require('request-promise-native');
const {writeFile, readFile} = require('fs');
const {appID, appsecret} = require('../confing');
const {writeFileAsync, readFileAsync} = require('../utils/tools');
const api = require('../api');
class Wechat {
    /**
     * 获取access_token
     * @return {Promise<result>}
     */
    async getAccessToken() {
        //定义请求地址
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
        //发送请求
        const result = await rp({method: 'GET', url, json: true});
        //设置access_token的过期时间, 提前5分钟刷新
        result.expires_in = Date.now() + 7200000 - 300000;
        //返回result
        return result;
    }

    /**
     * 保存access_token
     * @param filePath  要保存的文件路径
     * @param accessToken  要保存的凭据
     * @return {Promise<any>}
     */
    saveAccessToken(filePath, accessToken) {
    return writeFileAsync(filePath,accessToken);
    }

    /**
     * 读取access_token
     * @param filePath 文件路径
     * @return {Promise<any>}
     */
    readAccessToken(filePath) {
       return writeFileAsync(filePath);
    }

    /**
     * 判断access_token是否过期
     * @param accessToken
     * @return {boolean}
     */
    isValidAccessToken({expires_in}) {
        /*if (Date.now() >= expires_in) {
         //说明过期了
         return false
         } else {
         //说明没有过期
         return true
         }*/
        return Date.now() < expires_in;
    }

    /**
     * 返回有效access_token的方法
     * @return {Promise<accessToken>}
     */
    fetchAccessToken() {
        if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
            console.log('进来了~');
            //说明access_token是有效的
            return Promise.resolve({access_token: this.access_token, expires_in: this.expires_in});
        }

        //最终目的返回有效access_token
        return this.readAccessToken('./accessToken.txt')
            .then(async res => {
                if (this.isValidAccessToken(res)) {
                    //没有过期，直接使用
                    //作为then函数返回值， promise对象包着res
                    return res;
                } else {
                    //过期了
                    const accessToken = await this.getAccessToken();
                    await this.saveAccessToken('./accessToken.txt', accessToken);
                    //作为then函数返回值， promise对象包着accessToken
                    return accessToken;
                }
            })
            .catch(async err => {
                const accessToken = await this.getAccessToken();
                await this.saveAccessToken('./accessToken.txt', accessToken);
                return accessToken;
            })
            .then(res => {
                //不管上面成功或者失败都会来到这
                this.access_token = res.access_token;
                this.expires_in = res.expires_in;

                return Promise.resolve(res);
            })

    }
    async getTicket () {
        //获取access_token
        const {access_token} = await this.fetchAccessToken();
        //定义请求地址
        const url = `${api.ticket}access_token=${access_token}`;
        //发送请求
        const result = await rp({method: 'GET', url, json: true});
        //设置access_token的过期时间, 提前5分钟刷新
        // result.expires_in = Date.now() + 7200000 - 300000;
        //返回result
        return {
            ticket: result.ticket,
            ticket_expires_in: Date.now() + 7200000 - 300000
        };
    }

    saveTicket (filePath, ticket) {
        return writeFileAsync(filePath, ticket);
    }

    readTicket (filePath) {
        return readFileAsync(filePath);
    }

    isValidTicket ({ticket_expires_in}) {
        /*if (Date.now() >= expires_in) {
         //说明过期了
         return false
         } else {
         //说明没有过期
         return true
         }*/
        return Date.now() < ticket_expires_in;
    }

    fetchTicket () {
        if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
            console.log('进来了~');
            return Promise.resolve({ticket: this.ticket, ticket_expires_in: this.ticket_expires_in});
        }

        return this.readTicket('./ticket.txt')
            .then(async res => {
                if (this.isValidTicket(res)) {
                    //没有过期，直接使用
                    //作为then函数返回值， promise对象包着res
                    return res;
                } else {
                    //过期了
                    const ticket = await this.getTicket();
                    await this.saveTicket('./ticket.txt', ticket);
                    //作为then函数返回值， promise对象包着accessToken
                    return ticket;
                }
            })
            .catch(async err => {
                const ticket = await this.getTicket();
                await this.saveTicket('./ticket.txt', ticket);
                return ticket;
            })
            .then(res => {
                //不管上面成功或者失败都会来到这
                this.ticket = res.ticket;
                this.ticket_expires_in = res.ticket_expires_in;

                return Promise.resolve(res);
            })

    }
    /**
     * 创建自定义菜单
     * */
    async createMenu(menu) {
        try {
            //获取获取access_token
            const access_token = await this.fetchAccessToken();
            //定义请求地址
            const url = `${api.menu.create}access_token = ${access_token}`;
            //发送请求
            const result = await rp({method: 'POST', url, json: true, body: menu});
            return result;

        } catch (e) {
            return 'createMenu方法出了问题：' + e;
        }
    }

    /**
     * 删除菜单
     * */
    async deleteMenu() {
        try {
            const access_token = await this.fetchAccessToken();
            const url = `${api.menu.delete}access_token = ${access_token}`;
            const result = await rp({method: 'POST', url, json: true});
            return result;
        } catch (e) {
            return 'deleteMenu方法出了问题：' + e;
        }
    }

    /**
     * 创建标签
     * */
    async createTag (name){
        try {
            const access_token = await this.fetchAccessToken();
            const url = `${api.tag.create}access_token = ${access_token}`;
            const result = await rp({method:'POST',url,json:true,body:{tag: {name}}});
            return result;
        }catch (e){
            return 'createTag方法出了问题：' + e;
        }
    }
    async getTagUsers (tagid,next_openid=''){
        try {
            //获取access_token
            const access_token = await this.fetchAccessToken();
            const url = `{api.tag.getUsers}access_token = ${access_token} `;
            const result = await rp({method:'POST',url,json:true,body:{tagid, openid_list}});
            return result;
        }catch (e){
            return 'getTagUsers方法出了问题' + e;
        }
    }
    async batchUsersTag(openid_list,tagid){
        try {
            //获取access_token接口
            const access_token = await this.fetchAccessToken();
            //获取地址参数
            const url = `${api.tag.batch}access_token=${access_token}`;
            //获取参数
            const result = await rp({method:'POST',url,json:true,body: {tagid, openid_list}});
            return result;
        }catch (e){
            return 'batchUsersTag方法出了问题' + e;
        }
    }
    /**
     * 标签群发消息*/
    async sendAllByTag (options) {
        try {
            const {access_token} = await this.fetchAccessToken();
            const url = `${api.message.sendall}access_token=${access_token}`;
            return await rp({method: 'POST', url, json: true, body: options});
        } catch (e) {
            return 'sendAllByTag方法出了问题' + e;
        }
    }
    async uploadMaterial (type,material,body) {
        try {
            const access_token = await this.fetchAccessToken();
            let url = '';
            const options = {method:'POST',json:true};
            if (type === 'news'){
                url = `${api.upload.uploadNews}access_token=${access_token}`;
               options.body = material;
            }else if (type === 'pic'){
                url = `${api.upload.uploadimg}access_token=${access_token}`;
                options.formData = {
                    media:createReadStream(material)
                }
            }else {
                url = `${api.upload.uploadOthers}access_token=${access_token}&type=${type}`;
                options.formData = {
                    media:createReadStream(material)
                }
                if (type ==='video'){
                    options.body = body;
                }
            }
            options.url = url;
            return await rp(options);
        }catch (e){

        }
    }
}


(async () => {
    /*
     读取本地保存access_token（readAccessToken）
     - 有
     - 判断是否过期（isValidAccessToken）
     - 过期了, 重新发送请求，获取access_token（getAccessToken），保存下来（覆盖之前的）(saveAccessToken)
     - 没有过期, 直接使用
     - 没有
     - 发送请求，获取access_token，保存下来
     */
    // let result = await w.deleteMenu();
    // console.log(result);
    // result = await w.createMenu(require('./menu'));
    // console.log(result);
})()
module.exports = Wechat;
