export default ({
    router
}) => {
    const getScript = (source) => {
        return new Promise(function (resolve, reject) {
            let script = document.createElement('script');
            const prior = document.getElementsByTagName('script')[0];
            script.async = 1;
            prior.parentNode.insertBefore(script, prior);
            script.onerror = reject;
            script.onload = script.onreadystatechange = function (_, isAbort) {
                if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                    script.onload = script.onreadystatechange = null;
                    script = undefined;

                    if (!isAbort) {
                        resolve();
                    }
                }
            };

            script.src = source;
        });
    }

    /**
     * 路由切换事件处理
     */
    router.beforeEach(async (to, from, next) => {
        if (typeof window !== "undefined") {
    
            //发送cnzz的pv统计
            if (typeof _czc === "undefined") {
                await getScript("https://s9.cnzz.com/z_stat.php?id=1279171235&web_id=1279171235");
    
            }
            if (typeof _czc !== "undefined") {
                if (to.path) {
                    _czc.push(["_trackPageview", to.fullPath, from.fullPath]);
                }
            }
        }
        // continue
        next();
    });
};